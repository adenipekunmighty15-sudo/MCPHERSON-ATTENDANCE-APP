import { query } from '../../lib/db.js'

export async function runPredictorMigration() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS public.ai_predictions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        risk_score INT DEFAULT 0,
        academic_risk INT DEFAULT 0,
        feature_vector JSONB DEFAULT '{}'::jsonb,
        factors JSONB DEFAULT '[]'::jsonb,
        predicted_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('ai_predictions table ready')

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ai_predictions_user ON public.ai_predictions (user_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ai_predictions_risk ON public.ai_predictions (risk_score DESC)
    `)
    console.log('ai_predictions indexes ready')

    await query(`
      CREATE TABLE IF NOT EXISTS public.ai_insights (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        insight TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        severity INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        read BOOLEAN DEFAULT false
      )
    `)
    console.log('ai_insights table ready')

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON public.ai_insights (user_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ai_insights_unread ON public.ai_insights (user_id, read)
    `)
    console.log('ai_insights indexes ready')
  } catch (err) {
    console.error('Predictor migration error:', err.message)
    throw err
  }
}
