import { query } from '../../lib/db.js'

export async function runRagMigration() {
  try {
    await query('CREATE EXTENSION IF NOT EXISTS vector')
    console.log('pgvector extension ready')

    await query(`
      CREATE TABLE IF NOT EXISTS public.ai_embeddings (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        content TEXT NOT NULL,
        title TEXT DEFAULT '',
        type TEXT DEFAULT 'general',
        source_id TEXT DEFAULT '',
        metadata JSONB DEFAULT '{}'::jsonb,
        embedding vector(2048),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('ai_embeddings table ready')

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ai_embeddings_user ON public.ai_embeddings (user_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ai_embeddings_type ON public.ai_embeddings (type)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ai_embeddings_vector ON public.ai_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
    `)
    console.log('ai_embeddings indexes ready')

    await query(`
      CREATE OR REPLACE FUNCTION public.recreate_embedding(record_id UUID)
      RETURNS VOID AS $$
      BEGIN
        -- Placeholder for re-indexing logic.
        -- Call this after updating content to trigger a re-embed in application code.
        RAISE NOTICE 'Re-embedding triggered for record %', record_id;
      END;
      $$ LANGUAGE plpgsql
    `)
    console.log('recreate_embedding function ready')
  } catch (err) {
    console.error('RAG migration error:', err.message)
    throw err
  }
}
