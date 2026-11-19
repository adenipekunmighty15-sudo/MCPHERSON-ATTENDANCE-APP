import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const ident = (value) => `"${String(value).replace(/"/g, '""')}"`
const tableRef = (table) => `public.${ident(table)}`

const DESIRED_DEFAULTS = Object.freeze({
  'users.role': "'student'::text",
  'users.department': "'Computer Science'::text",
  'users.provider': "'email'::text",
  'users.face_descriptor': "''::text",
  'users.created_at': 'now()',
  'users.last_login': 'now()',
  'courses.level': "'100'::text",
  'courses.units': '3',
  'courses.department': "''::text",
  'courses.department_name': "''::text",
  'courses.college': "''::text",
  'courses.lecturer_id': "''::text",
  'courses.custom': 'false',
  'courses.created_at': 'now()',
  'timetable.room': "''::text",
  'timetable.lecturer': "''::text",
  'timetable.type': "'lecture'::text",
  'timetable.created_at': 'now()',
  'attendance.course_id': "''::text",
  'attendance.course_name': "''::text",
  'attendance.status': "'present'::text",
  'attendance.method': "'manual'::text",
  'attendance.timestamp': 'now()',
  'attendance.location': "''::text",
  'study_materials.course_id': "''::text",
  'study_materials.summary': "''::text",
  'study_materials.key_points': "'[]'::jsonb",
  'study_materials.flashcards': "'[]'::jsonb",
  'study_materials.quiz': "'[]'::jsonb",
  'study_materials.created_at': 'now()',
})

function defaultForColumn(column) {
  if (column.column_default) return column.column_default

  const type = column.udt_name || column.data_type
  const dataType = column.data_type

  if (dataType === 'timestamp with time zone' || dataType === 'timestamp without time zone') {
    return 'now()'
  }
  if (dataType === 'date') return 'CURRENT_DATE'
  if (dataType === 'time without time zone' || dataType === 'time with time zone') return '00:00:00'
  if (dataType === 'boolean') return 'false'
  if (type === 'jsonb') return "'{}'::jsonb"
  if (type === 'json') return "'{}'::json"
  if (dataType === 'ARRAY') return "'{}'"
  if (['int2', 'int4', 'int8', 'numeric', 'float4', 'float8', 'money'].includes(type)) return '0'
  if (['text', 'varchar', 'bpchar', 'citext'].includes(type)) return "''"
  if (type === 'uuid') return 'uuid_generate_v4()'
  return null
}

async function foreignKeyFor(client, table, column) {
  const { rows } = await client.query(
    `SELECT ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
     FROM pg_constraint con
     JOIN pg_class rel ON rel.oid = con.conrelid
     JOIN pg_namespace ns ON ns.oid = rel.relnamespace
     JOIN information_schema.key_column_usage kcu
       ON kcu.constraint_name = con.conname
      AND kcu.table_schema = ns.nspname
      AND kcu.table_name = rel.relname
     JOIN information_schema.constraint_column_usage ccu
       ON ccu.constraint_name = con.conname
      AND ccu.table_schema = ns.nspname
     WHERE con.contype = 'f'
       AND ns.nspname = 'public'
       AND rel.relname = $1
       AND kcu.column_name = $2
     LIMIT 1`,
    [table, column]
  )
  return rows[0] || null
}

async function ensureChatTables(client) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS public.chat_conversations (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
       title TEXT NOT NULL DEFAULT 'New Chat',
       model TEXT NOT NULL DEFAULT 'nvidia',
       context JSONB NOT NULL DEFAULT '{}'::jsonb,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS public.chat_messages (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
       role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
       content TEXT NOT NULL DEFAULT '',
       metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS public.general_chat_messages (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
       message TEXT NOT NULL DEFAULT '',
       file_url TEXT NOT NULL DEFAULT '',
       file_type TEXT NOT NULL DEFAULT '',
       file_name TEXT NOT NULL DEFAULT '',
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
    `ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb`,
    `CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON public.chat_conversations(updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id)`,
    `CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_general_chat_messages_sender_id ON public.general_chat_messages(sender_id)`,
    `CREATE INDEX IF NOT EXISTS idx_general_chat_messages_created_at ON public.general_chat_messages(created_at DESC)`,
  ]

  for (const sql of statements) {
    await client.query(sql)
  }
  console.log('Ensured chat tables exist with NOT NULL columns')
}

async function enforceNotNull(client) {
  const { rows: nullableColumns } = await client.query(
    `SELECT c.table_name, c.column_name, c.data_type, c.udt_name, c.column_default, c.is_generated
     FROM information_schema.columns c
     JOIN information_schema.tables t
       ON t.table_schema = c.table_schema AND t.table_name = c.table_name
     WHERE c.table_schema = 'public'
       AND t.table_type = 'BASE TABLE'
       AND c.is_nullable = 'YES'
     ORDER BY c.table_name, c.ordinal_position`
  )

  for (const column of nullableColumns) {
    if (column.is_generated === 'ALWAYS' || column.is_generated === 'YES') {
      throw new Error(`Generated column public.${column.table_name}.${column.column_name} cannot be altered to NOT NULL`)
    }

    const table = tableRef(column.table_name)
    const col = ident(column.column_name)
    const fk = await foreignKeyFor(client, column.table_name, column.column_name)

    if (fk) {
      const { rows } = await client.query(
        `SELECT count(*)::int AS n FROM ${table} WHERE ${col} IS NULL`
      )
      const nullCount = rows[0].n
      if (nullCount > 0) {
        const parent = await client.query(
          `SELECT ${ident(fk.foreign_column)} AS id
           FROM public.${ident(fk.foreign_table)}
           ORDER BY ${ident(fk.foreign_column)}
           LIMIT 1`
        )
        if (parent.rowCount) {
          await client.query(
            `UPDATE ${table} SET ${col} = $1 WHERE ${col} IS NULL`,
            [parent.rows[0].id]
          )
          console.log(`Backfilled ${column.table_name}.${column.column_name} for ${nullCount} row(s)`)
        } else {
          await client.query(`DELETE FROM ${table} WHERE ${col} IS NULL`)
          console.log(`Removed ${nullCount} orphaned row(s) from ${column.table_name} (no parent available for ${column.column_name})`)
        }
      }
      await client.query(`ALTER TABLE ${table} ALTER COLUMN ${col} SET NOT NULL`)
      console.log(`Set public.${column.table_name}.${column.column_name} NOT NULL`)
      continue
    }

    const defaultValue = defaultForColumn(column)
    if (!defaultValue) {
      throw new Error(
        `No safe NOT NULL default for public.${column.table_name}.${column.column_name} (${column.data_type})`
      )
    }

    await client.query(`UPDATE ${table} SET ${col} = ${defaultValue} WHERE ${col} IS NULL`)
    await client.query(`ALTER TABLE ${table} ALTER COLUMN ${col} SET DEFAULT ${defaultValue}`)
    await client.query(`ALTER TABLE ${table} ALTER COLUMN ${col} SET NOT NULL`)
    console.log(`Backfilled + set public.${column.table_name}.${column.column_name} NOT NULL (default ${defaultValue})`)
  }
}

async function normalizeDefaults(client) {
  for (const [key, defaultValue] of Object.entries(DESIRED_DEFAULTS)) {
    const [table, column] = key.split('.')
    await client.query(
      `ALTER TABLE ${tableRef(table)} ALTER COLUMN ${ident(column)} SET DEFAULT ${defaultValue}`
    )
    await client.query(
      `UPDATE ${tableRef(table)} SET ${ident(column)} = ${defaultValue} WHERE ${ident(column)} IS NULL`
    )
  }
  console.log('Restored semantic defaults for application columns')
}

async function verify(client) {
  const { rows } = await client.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND is_nullable = 'YES'
     ORDER BY table_name, ordinal_position`
  )
  if (rows.length) {
    throw new Error(`Nullable public columns remain: ${rows.map(r => `${r.table_name}.${r.column_name}`).join(', ')}`)
  }
  console.log('Verified: zero nullable columns in the public schema')
}

const client = await pool.connect()
try {
  await client.query('BEGIN')
  await ensureChatTables(client)
  await enforceNotNull(client)
  await normalizeDefaults(client)
  await verify(client)
  await client.query('COMMIT')
  console.log('Public schema is now strictly NOT NULL')
} catch (error) {
  await client.query('ROLLBACK')
  console.error('Migration rolled back:', error.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
