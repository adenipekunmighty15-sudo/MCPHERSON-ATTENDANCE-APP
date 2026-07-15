import { randomUUID } from 'crypto'
import { query } from '../lib/db.js'

async function migrate() {
  console.log('Starting flashcards migration...')

  const { rows: packs } = await query(
    `SELECT id, flashcards FROM public.study_materials WHERE flashcards IS NOT NULL AND flashcards != '[]'::jsonb`
  )
  console.log(`Found ${packs.length} study packs with flashcards`)

  const idMap = new Map()
  let inserted = 0

  for (const pack of packs) {
    const cards = Array.isArray(pack.flashcards) ? pack.flashcards : JSON.parse(pack.flashcards || '[]')
    if (!cards.length) continue

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      const front = card.front || card.question || ''
      const back = card.back || card.answer || ''
      if (!front && !back) continue

      const newId = crypto.randomUUID()
      await query(
        `INSERT INTO public.flashcards (id, material_id, front, back, order_index) VALUES ($1,$2,$3,$4,$5)`,
        [newId, pack.id, front, back, i]
      )
      idMap.set(`${pack.id}:${card.id}`, newId)
      inserted++
    }
  }
  console.log(`Inserted ${inserted} flashcards into new table`)

  console.log('Updating flashcard_reviews to use new UUIDs...')
  let updated = 0
  for (const [key, newId] of idMap) {
    const [materialId, oldFlashcardId] = key.split(':')
    const { rowCount } = await query(
      `UPDATE public.flashcard_reviews SET flashcard_id = $1 WHERE material_id = $2 AND flashcard_id = $3`,
      [newId, materialId, oldFlashcardId]
    )
    if (rowCount) updated += rowCount
  }
  console.log(`Updated ${updated} flashcard_reviews`)

  console.log('Dropping flashcards column from study_materials...')
  await query(`ALTER TABLE public.study_materials DROP COLUMN IF EXISTS flashcards`)
  console.log('Column dropped.')

  console.log('Migration complete!')
  process.exit(0)
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
