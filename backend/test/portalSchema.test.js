import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const migration = readFileSync(join(import.meta.dirname, '../src/migrations/015_portal_schema_backfill.sql'), 'utf8')

test('portal schema backfill is additive and idempotent', () => {
  for (const table of ['live_sessions', 'flashcards', 'complaints', 'direct_conversations', 'direct_conversation_members', 'direct_messages']) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}`))
  }
  assert.match(migration, /ADD COLUMN IF NOT EXISTS session_id/)
  assert.match(migration, /ADD COLUMN IF NOT EXISTS diagrams/)
  assert.match(migration, /ADD COLUMN IF NOT EXISTS admin_response/)
})

test('portal schema backfill keeps new tables out of the Data API', () => {
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/g)
  assert.match(migration, /REVOKE ALL ON[\s\S]*FROM anon, authenticated/)
})
