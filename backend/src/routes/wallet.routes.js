import express from 'express'
import { query } from '../../lib/db.js'
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

// Fund wallet (Simulated)
router.post('/api/wallet/fund', requireAuth, async (req, res) => {
  try {
    const { amount, source = 'Card Deposit' } = req.body
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const { rows } = await query(`
      INSERT INTO public.wallet_transactions (user_id, amount, type, description)
      VALUES ($1, $2, 'credit', $3)
      RETURNING *
    `, [req.user.id, amount, source])
    
    res.json({ success: true, transaction: rows[0] })
  } catch (err) {
    console.error('Error funding wallet:', err)
    res.status(500).json({ error: 'Failed to fund wallet' })
  }
})

// Make a payment (Simulated)
router.post('/api/wallet/pay', requireAuth, async (req, res) => {
  try {
    const { amount, description = 'Campus Purchase' } = req.body
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Check balance first
    const { rows: balRows } = await query(`
      SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) as balance
      FROM public.wallet_transactions 
      WHERE user_id = $1
    `, [req.user.id])
    
    const balance = parseFloat(balRows[0].balance)
    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' })
    }

    const { rows } = await query(`
      INSERT INTO public.wallet_transactions (user_id, amount, type, description)
      VALUES ($1, $2, 'debit', $3)
      RETURNING *
    `, [req.user.id, amount, description])
    
    res.json({ success: true, transaction: rows[0] })
  } catch (err) {
    console.error('Error making payment:', err)
    res.status(500).json({ error: 'Failed to process payment' })
  }
})

export default router
