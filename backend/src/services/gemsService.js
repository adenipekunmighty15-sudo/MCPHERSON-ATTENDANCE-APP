import { query } from '../../lib/db.js'

export async function getGems(userId, includePublic = true) {
  const sql = includePublic
    ? `SELECT * FROM public.gems WHERE user_id = $1 OR is_public = true ORDER BY is_public DESC, usage_count DESC`
    : `SELECT * FROM public.gems WHERE user_id = $1 ORDER BY usage_count DESC`
  const { rows } = await query(sql, [userId])
  return rows
}

export async function getGemById(id) {
  const { rows } = await query(`SELECT * FROM public.gems WHERE id = $1`, [id])
  return rows[0] || null
}

export async function createGem(userId, { name, description, systemPrompt, model, temperature, isPublic }) {
  const { rows } = await query(
    `INSERT INTO public.gems (user_id, name, description, system_prompt, model, temperature, is_public)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [userId, name, description || '', systemPrompt, model || 'turbo', temperature || 0.3, isPublic || false]
  )
  return rows[0]
}

export async function updateGem(id, userId, updates) {
  const fields = []
  const vals = []
  let i = 1
  for (const [k, v] of Object.entries(updates)) {
    const col = k.replace(/([A-Z])/g, '_$1').toLowerCase()
    fields.push(`${col} = $${i++}`)
    vals.push(v)
  }
  vals.push(id, userId)
  const { rows } = await query(
    `UPDATE public.gems SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} AND (user_id = $${i + 1} OR is_public = false) RETURNING *`,
    vals
  )
  return rows[0] || null
}

export async function deleteGem(id, userId) {
  const { rowCount } = await query(`DELETE FROM public.gems WHERE id = $1 AND user_id = $2`, [id, userId])
  return rowCount > 0
}

export async function incrementGemUsage(id) {
  await query(`UPDATE public.gems SET usage_count = usage_count + 1 WHERE id = $1`, [id])
}
