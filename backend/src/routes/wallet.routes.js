import express from 'express'
import { query, pool } from '../../lib/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Get wallet balance
router.get('/api/wallet/balance', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) as balance
      FROM public.wallet_transactions 
      WHERE user_id = $1
    `, [req.user.id])
    
    res.json({ balance: parseFloat(rows[0].balance) })
  } catch (err) {
    console.error('Error fetching wallet balance:', err)
    res.status(500).json({ error: 'Failed to fetch balance' })
  }
})

// Get transaction history
router.get('/api/wallet/transactions', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT id, amount, type, description, created_at 
      FROM public.wallet_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [req.user.id])
    
    res.json(rows)
  } catch (err) {
    console.error('Error fetching wallet transactions:', err)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

// Funding is unavailable until verified payment-provider webhooks are configured.
router.post('/api/wallet/fund', requireAuth, async (req, res) => {
  res.status(503).json({ error: 'Wallet funding is unavailable until a verified payment provider is configured' })
})

router.post('/api/wallet/pay', requireAuth, async (req, res) => {
  const { amount, description = 'Campus Purchase' } = req.body
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' })
  }
  if (typeof description !== 'string' || description.length > 200) {
    return res.status(400).json({ error: 'Description must be a string of at most 200 characters' })
  }

  let client
  let transactionStarted = false
  try {
    client = await pool.connect()
    await client.query('BEGIN')
    transactionStarted = true

    const { rows: users } = await client.query(
      'SELECT id FROM public.users WHERE id = $1 FOR UPDATE',
      [req.user.id]
    )
    if (!users.length) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(404).json({ error: 'Wallet owner not found' })
    }

    const { rows: balRows } = await client.query(`
      SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) as balance
      FROM public.wallet_transactions 
      WHERE user_id = $1
    `, [req.user.id])
    
    const balance = parseFloat(balRows[0].balance)
    if (balance < amount) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(400).json({ error: 'Insufficient funds' })
    }

    const { rows } = await client.query(`
      INSERT INTO public.wallet_transactions (user_id, amount, type, description)
      VALUES ($1, $2, 'debit', $3)
      RETURNING *
    `, [req.user.id, amount, description])
    await client.query('COMMIT')
    transactionStarted = false
    res.json({ success: true, transaction: rows[0] })
  } catch (err) {
    console.error('Error making payment:', err)
    res.status(500).json({ error: 'Failed to process payment' })
  } finally {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Failed to roll back wallet payment:', rollbackError.message)
      }
    }
    if (client) client.release()
  }
})

export default router
