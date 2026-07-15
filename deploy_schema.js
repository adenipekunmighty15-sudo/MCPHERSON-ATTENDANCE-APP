const { Pool } = require('pg');
const fs = require('fs');

const sql = fs.readFileSync('schema_corrected.sql', 'utf8');

const pool = new Pool({
  connectionString: 'postgresql://postgres.ptjxkzhqecrbarinbpfn:Mighty%401234567890%21@aws-1-eu-central-1.pooler.supabase.com:6543/postgres',
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

    // Dollar quote: $$ or $tag$
    if (ch === '$') {
      const match = sqlText.slice(i).match(/^(\$[a-zA-Z_]*\$)/);
      if (match) {
        const tag = match[1];
        current += tag;
        i += tag.length;
        // Find matching close
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

    // Single quote
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

    // Line comment
    if (ch === '-' && sqlText[i + 1] === '-') {
      let end = sqlText.indexOf('\n', i);
      if (end === -1) end = sqlText.length;
      current += sqlText.slice(i, end + 1);
      i = end + 1;
      continue;
    }

    // Block comment
    if (ch === '/' && sqlText[i + 1] === '*') {
      let end = sqlText.indexOf('*/', i + 2);
      if (end === -1) end = sqlText.length - 2;
      current += sqlText.slice(i, end + 2);
      i = end + 2;
      continue;
    }

    // Semicolon = statement boundary
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

async function run() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected. Running schema...');

    const statements = splitStatements(sql);
    console.log(`Total statements: ${statements.length}`);

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt);
        success++;
      } catch (e) {
        const msg = e.message || '';
        if (msg.includes('already exists') || msg.includes('duplicate')) {
          skipped++;
        } else if (msg.includes('does not exist') || msg.includes('does not exist')) {
          skipped++;
          console.error(`[SKIP] #${i + 1}: ${msg.substring(0, 200)}`);
        } else {
          failed++;
          console.error(`\n[FAIL] #${i + 1}:`);
          console.error('Error:', msg.substring(0, 300));
          console.error('SQL:', stmt.substring(0, 200));
          console.error('');
        }
      }
      if ((i + 1) % 50 === 0) {
        console.log(`Progress: ${i + 1}/${statements.length} (ok:${success} skip:${skipped} fail:${failed})`);
      }
    }

    console.log(`\nDone! ${success} succeeded, ${skipped} skipped, ${failed} failed`);
    client.release();
    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  } catch (e) {
    console.error('Fatal error:', e.message);
    process.exit(1);
  }
}

run();
