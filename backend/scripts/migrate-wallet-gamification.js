import { query } from '../lib/db.js'

async function migrate() {
  console.log('Migrating Wallet & Gamification tables...')

  try {
    // 1. Wallet Transactions Table
    await query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created wallet_transactions table')

    // 2. Gamification Profiles Table
    await query(`
      CREATE TABLE IF NOT EXISTS gamification_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        xp INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_study_date TIMESTAMP
      )
    `)
    console.log('✅ Created gamification_profiles table')

    // 3. Gamification Badges Table
    await query(`
      CREATE TABLE IF NOT EXISTS gamification_badges (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        badge_id VARCHAR(100) NOT NULL,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, badge_id)
      )
    `)
    console.log('✅ Created gamification_badges table')

    // 4. Backfill gamification profiles for existing users
    await query(`
      INSERT INTO gamification_profiles (user_id)
      SELECT id FROM users
      ON CONFLICT (user_id) DO NOTHING
    `)
    console.log('✅ Backfilled existing users into gamification_profiles')

    console.log('🎉 Migration complete!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
}

migrate()
