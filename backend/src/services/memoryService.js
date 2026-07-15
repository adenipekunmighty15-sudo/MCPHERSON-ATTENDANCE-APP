import { query } from '../../lib/db.js'

export async function getMemory(userId, category = null) {
  if (category) {
    const { rows } = await query(
      `SELECT key, value, category, updated_at FROM public.user_memory WHERE user_id = $1 AND category = $2 ORDER BY updated_at DESC`,
      [userId, category]
    )
    return rows
  }
  const { rows } = await query(
    `SELECT key, value, category, updated_at FROM public.user_memory WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId]
  )
  return rows
}

export async function setMemory(userId, key, value, category = 'general') {
  const { rows } = await query(
    `INSERT INTO public.user_memory (user_id, key, value, category, updated_at)
     VALUES ($1,$2,$3,$4,NOW())
     ON CONFLICT (user_id, key)
     DO UPDATE SET value = EXCLUDED.value, category = EXCLUDED.category, updated_at = NOW()
     RETURNING *`,
    [userId, key, value, category]
  )
  return rows[0]
}

export async function deleteMemory(userId, key) {
  const { rowCount } = await query(`DELETE FROM public.user_memory WHERE user_id = $1 AND key = $2`, [userId, key])
  return rowCount > 0
}

export async function getMemoryContext(userId) {
  const mems = await getMemory(userId)
  if (!mems.length) return ''
  const lines = mems.map(m => `- ${m.key}: ${m.value}`)
  return `\n\n--- KNOWN USER CONTEXT ---\n${lines.join('\n')}\n--- END USER CONTEXT ---`
}
