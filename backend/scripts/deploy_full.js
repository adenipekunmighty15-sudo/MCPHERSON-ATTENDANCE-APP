const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  // The database connection URL.
  // Set this in your environment variables.
  // Example: "postgresql://user:password@host:port/database"
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
});

function splitStatements(sqlText) {
  const stmts = [];
  let current = '';
  let i = 0;

  while (i < sqlText.length) {
    const ch = sqlText[i];

    if (ch === '$') {
      const match = sqlText.slice(i).match(/^(\$[a-zA-Z_]*\$)/);
      if (match) {
        const tag = match[1];
        current += tag;
        i += tag.length;
        let closeIdx = sqlText.indexOf(tag, i);
        if (closeIdx === -1) closeIdx = sqlText.length;
        current += sqlText.slice(i, closeIdx + tag.length);
        i = closeIdx + tag.length;
        continue;
      }
      current += ch;
      i++;
      continue;
    }

    if (ch === "'") {
      current += ch;
      i++;
      while (i < sqlText.length) {
        if (sqlText[i] === "'" && sqlText[i + 1] === "'") {
          current += "''";
          i += 2;
        } else if (sqlText[i] === "'") {
          current += "'";
          i++;
          break;
        } else {
          current += sqlText[i];
          i++;
        }
      }
      continue;
    }

    if (ch === '-' && sqlText[i + 1] === '-') {
      let end = sqlText.indexOf('\n', i);
      if (end === -1) end = sqlText.length;
      current += sqlText.slice(i, end + 1);
      i = end + 1;
      continue;
    }

    if (ch === '/' && sqlText[i + 1] === '*') {
      let end = sqlText.indexOf('*/', i + 2);
      if (end === -1) end = sqlText.length - 2;
      current += sqlText.slice(i, end + 2);
      i = end + 2;
      continue;
    }

    if (ch === ';') {
      current += ';';
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        stmts.push(trimmed);
      }
      current = '';
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) {
    stmts.push(trimmed);
  }

  return stmts;
}

async function runSqlFile(client, filename) {
  const sql = fs.readFileSync(filename, 'utf8');
  const statements = splitStatements(sql);
  console.log(`\n--- ${filename}: ${statements.length} statements ---`);

  let success = 0, skipped = 0, failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await client.query(stmt);
      success++;
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        skipped++;
      } else {
        failed++;
        console.error(`  [FAIL] #${i + 1}: ${msg.substring(0, 200)}`);
        console.error(`  SQL: ${stmt.substring(0, 150)}`);
      }
    }
    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/${statements.length} (ok:${success} skip:${skipped} fail:${failed})`);
    }
  }

  console.log(`  Result: ${success} ok, ${skipped} skipped, ${failed} failed`);
  return { success, skipped, failed };
}

async function run() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected.\n');

    // 1. Run migration (adds missing columns)
    const mig = await runSqlFile(client, 'schema_migration.sql');

    // 2. Run main schema
    const schema = await runSqlFile(client, 'schema_corrected.sql');

    const totalFailed = mig.failed + schema.failed;
    console.log(`\n=== TOTAL: ${mig.success + schema.success} ok, ${mig.skipped + schema.skipped} skipped, ${totalFailed} failed ===`);

    client.release();
    await pool.end();
    process.exit(totalFailed > 0 ? 1 : 0);
  } catch (e) {
    console.error('Fatal error:', e.message);
    process.exit(1);
  }
}

run();
