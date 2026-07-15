import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'

async function notifyUser(userId, type, title, message, link, data = {}) {
  try {
    const id = randomUUID()
    await query(
      `INSERT INTO public.notifications (id, user_id, type, title, message, data, link, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
      [id, userId, type, title, message, JSON.stringify(data), link || '']
    )
  } catch (err) {
    console.error('Failed to send notification:', err.message)
  }
}

async function notifyDepartment(department, type, title, message, link, data = {}) {
  try {
    const { rows } = await query(
      "SELECT id FROM public.users WHERE department = $1 AND role = 'student'",
      [department]
    )
    for (const user of rows) {
      await notifyUser(user.id, type, title, message, link, data)
    }
  } catch (err) {
    console.error('Failed to notify department:', err.message)
  }
}

export { notifyUser, notifyDepartment }
