/**
 * TurboLearn AI Service
 * Handles advanced study features inspired by TurboLearn AI platform:
 * - Podcast generation from study materials
 * - Audio transcription and processing
 * - Enhanced flashcard generation with spaced repetition
 * - Study group collaboration
 * - Adaptive learning recommendations
 */

import { getAiResponse, getAvailableProviders } from '../config/ai.js'
import { query } from '../../lib/db.js'
import { randomUUID } from 'crypto'

/**
 * Generate podcast from study material
 * Uses text-to-speech via AI to create audio from study notes
 */
async function generatePodcast(materialId, userId, options = {}) {
  try {
    const { rows: materials } = await query(
      `SELECT id, title, summary, improved_note, key_points 
       FROM study_materials WHERE id = $1 AND created_by = $2`,
      [materialId, userId]
    )
    
    if (!materials.length) {
      throw new Error('Study material not found')
    }

    const material = materials[0]
    const text = material.summary || material.improved_note || 'Unable to generate podcast from this material'
    
    // Format the text for podcast (more conversational, shorter segments)
    const podcastScript = formatForPodcast(text, options.maxLength || 3000)
    
    // Store podcast generation request
    const { rows: podcast } = await query(
      `INSERT INTO podcasts 
       (material_id, user_id, script, status, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, created_at`,
      [materialId, userId, podcastScript, 'pending']
    )

    return {
      id: podcast[0].id,
      materialId,
      title: `${material.title} - Podcast`,
      script: podcastScript,
      status: 'pending',
      createdAt: podcast[0].created_at
    }
  } catch (err) {
    console.error('Podcast generation error:', err.message)
    throw err
  }
}

/**
 * Format text for podcast - make it more conversational
 */
function formatForPodcast(text, maxLength = 3000) {
  // Remove markdown formatting
  let cleaned = text
    .replace(/[#*_`\[\]]/g, '')
    .replace(/\n\n+/g, '\n')
    .trim()

  // Truncate if needed
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength) + '...'
  }

  // Add conversational markers
  const segments = cleaned.split('\n').filter(s => s.trim())
  const script = segments
    .map((seg, i) => {
      if (i === 0) return `Let's start by reviewing: ${seg}`
      if (i === segments.length - 1) return `Finally, remember: ${seg}`
      return seg
    })
    .join('\n\n')

  return script
}

/**
 * Transcribe audio file and create study material
 */
async function transcribeAudio(audioBuffer, fileName, courseId, userId) {
  try {
    // In a real implementation, you'd use a speech-to-text API
    // For now, we'll create a placeholder
    const transcript = `[Audio transcription from: ${fileName}]\n\nAudio processing would require integration with a speech-to-text API such as Google Speech-to-Text, Azure Speech Services, or Whisper API.`
    
    // Create study material from transcription
    const { rows: created } = await query(
      `INSERT INTO study_materials 
       (course_id, title, source_text, summary, created_by, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id, created_at`,
      [courseId, `Audio: ${fileName}`, transcript, transcript.substring(0, 200), userId]
    )

    return {
      id: created[0].id,
      title: `Audio: ${fileName}`,
      sourceText: transcript,
      createdAt: created[0].created_at
    }
  } catch (err) {
    console.error('Audio transcription error:', err.message)
    throw err
  }
}

/**
 * Generate enhanced flashcards with better pedagogy
 */
async function generateEnhancedFlashcards(materialId, userId, count = 15) {
  try {
    const { rows: materials } = await query(
      'SELECT * FROM study_materials WHERE id = $1 AND created_by = $2',
      [materialId, userId]
    )

    if (!materials.length) {
      throw new Error('Study material not found')
    }

    const material = materials[0]
    const sourceText = material.improved_note || material.summary || material.source_text || 'Study material'

    // Generate flashcards using AI for better quality
    const prompt = `Generate ${count} high-quality flashcards from this material. 
Each flashcard should:
1. Test deep understanding, not just memorization
2. Use varied question types: definitions, applications, comparisons, analysis
3. Include explanations for why answers are correct
4. Be appropriate for academic study

Return ONLY a JSON array with no markdown, no code blocks, just the array. Format:
[{"front": "Question", "back": "Answer with explanation", "difficulty": 3, "category": "concept"}]

Material:
${sourceText.substring(0, 5000)}`

    let cards = []
    const providers = getAvailableProviders()
    
    // Try each provider until one succeeds
    for (const provider of providers) {
      try {
        const response = await getAiResponse(provider, [
          { role: 'user', content: prompt }
        ], { temperature: 0.7 })
        
        // Extract JSON from response
        const jsonMatch = response.match(/\[\s*{[\s\S]*}\s*\]/)
        if (jsonMatch) {
          cards = JSON.parse(jsonMatch[0])
          break
        }
      } catch (e) {
        console.log(`Provider ${provider} failed: ${e.message}`)
        continue
      }
    }

    if (!cards || cards.length === 0) {
      throw new Error('Could not generate flashcards with any AI provider')
    }

    // Save to database with UUID
    const savedCards = []
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      const { rows: inserted } = await query(
        `INSERT INTO flashcards 
         (id, material_id, front, back, order_index, difficulty, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [randomUUID(), materialId, card.front || '', card.back || '', i, 
         Math.min(5, Math.max(1, card.difficulty || 3)), card.category || 'concept']
      )
      savedCards.push({
        id: inserted[0].id,
        front: card.front,
        back: card.back,
        difficulty: card.difficulty,
        category: card.category
      })
    }

    return {
      success: true,
      count: savedCards.length,
      cards: savedCards,
      materialId,
      message: `✓ Successfully generated ${savedCards.length} flashcards! Ready to start learning.`
    }
  } catch (err) {
    console.error('Enhanced flashcard generation error:', err.message)
    throw new Error(`Flashcard generation failed: ${err.message}`)
  }
}

/**
 * Get spaced repetition recommendations
 * Analyzes user's flashcard performance and suggests what to study
 */
async function getSpacedRepetitionPlan(userId) {
  try {
    // Get flashcards due for review (based on SM-2 algorithm)
    const { rows: dueCards } = await query(
      `SELECT 
        fr.id, fr.material_id, sm.title, fr.ease_factor, fr.interval_days, 
        fr.next_review, fr.repetitions, sm.course_id
       FROM flashcard_reviews fr
       JOIN flashcards f ON fr.flashcard_id = f.id
       JOIN study_materials sm ON fr.material_id = sm.id
       WHERE fr.user_id = $1 AND fr.next_review <= NOW()
       ORDER BY fr.next_review ASC
       LIMIT 50`,
      [userId]
    )

    // Get weak areas (materials with low performance)
    const { rows: weakAreas } = await query(
      `SELECT 
        sm.id, sm.title, sm.course_id,
        COALESCE(AVG(NULLIF(fr.ease_factor, 0)), 2.5) as avg_ease,
        COUNT(DISTINCT fr.flashcard_id)::int as card_count
       FROM study_materials sm
       LEFT JOIN flashcard_reviews fr ON sm.id = fr.material_id AND fr.user_id = $1
       WHERE sm.created_by = $1 OR fr.user_id = $1
       GROUP BY sm.id, sm.title, sm.course_id
       ORDER BY avg_ease ASC, card_count DESC
       LIMIT 10`,
      [userId]
    )

    // Get overall statistics
    const { rows: stats } = await query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN repetitions >= 3 THEN flashcard_id END)::int as mastered,
        COUNT(DISTINCT CASE WHEN repetitions = 2 THEN flashcard_id END)::int as learning,
        COUNT(DISTINCT CASE WHEN repetitions < 2 THEN flashcard_id END)::int as new,
        COUNT(DISTINCT material_id)::int as total_materials
       FROM flashcard_reviews
       WHERE user_id = $1`,
      [userId]
    )

    // Calculate recommended daily study time (in minutes)
    const cardsDue = Math.max(0, dueCards.length)
    const dailyMinutes = Math.min(Math.max(cardsDue * 1.5, 15), 120)

    const overallStats = stats[0] || { mastered: 0, learning: 0, new: 0, total_materials: 0 }

    return {
      success: true,
      cardsReady: cardsDue,
      cardsReview: dueCards.slice(0, 20),
      weakAreas: weakAreas
        .filter(w => w.card_count > 0)
        .map(w => ({
          materialId: w.id,
          title: w.title,
          strength: Math.round(Math.max(0, Math.min(100, (w.avg_ease / 3) * 100))),
          cardCount: w.card_count
        })),
      statistics: {
        masteredCards: overallStats.mastered,
        learningCards: overallStats.learning,
        newCards: overallStats.new,
        totalMaterials: overallStats.total_materials
      },
      recommendedDaily: {
        minutes: Math.round(dailyMinutes),
        cardsPerSession: Math.min(20, Math.max(5, Math.ceil(cardsDue / 5)))
      },
      message: `Ready to learn! You have ${cardsDue} cards due for review today. Aim for about ${Math.round(dailyMinutes)} minutes of study.`
    }
  } catch (err) {
    console.error('Spaced repetition plan error:', err.message)
    throw new Error(`Could not load study plan: ${err.message}`)
  }
}

/**
 * Create or join a study group
 */
async function createStudyGroup(name, description, courseId, creatorId) {
  try {
    const { rows: group } = await query(
      `INSERT INTO study_groups 
       (name, description, course_id, creator_id, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, created_at`,
      [name, description, courseId, creatorId]
    )

    // Add creator as member
    await query(
      `INSERT INTO study_group_members 
       (group_id, user_id, role, joined_at) 
       VALUES ($1, $2, $3, NOW())`,
      [group[0].id, creatorId, 'creator']
    )

    return {
      id: group[0].id,
      name,
      description,
      courseId,
      creatorId,
      createdAt: group[0].created_at,
      memberCount: 1
    }
  } catch (err) {
    console.error('Study group creation error:', err.message)
    throw err
  }
}

/**
 * Share study material with study group
 */
async function shareWithGroup(materialId, groupId, userId) {
  try {
    // Verify user is member of group
    const { rows: member } = await query(
      'SELECT id FROM study_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    )

    if (!member.length) {
      throw new Error('User is not a member of this group')
    }

    // Share the material
    const { rows: shared } = await query(
      `INSERT INTO group_shared_materials 
       (group_id, material_id, shared_by, shared_at) 
       VALUES ($1, $2, $3, NOW()) 
       ON CONFLICT (group_id, material_id) DO UPDATE SET shared_at = NOW()
       RETURNING id`,
      [groupId, materialId, userId]
    )

    return {
      id: shared[0].id,
      materialId,
      groupId,
      sharedBy: userId
    }
  } catch (err) {
    console.error('Share with group error:', err.message)
    throw err
  }
}

/**
 * Get study group materials
 */
async function getGroupMaterials(groupId, userId) {
  try {
    // Verify user is member
    const { rows: member } = await query(
      'SELECT id FROM study_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    )

    if (!member.length) {
      throw new Error('User is not a member of this group')
    }

    const { rows: materials } = await query(
      `SELECT 
        sm.id, sm.title, sm.summary, sm.created_by, 
        u.name as creator_name, gsm.shared_at,
        (SELECT COUNT(*) FROM flashcards WHERE material_id = sm.id)::int as flashcard_count
       FROM group_shared_materials gsm
       JOIN study_materials sm ON gsm.material_id = sm.id
       JOIN users u ON sm.created_by = u.id
       WHERE gsm.group_id = $1
       ORDER BY gsm.shared_at DESC`,
      [groupId]
    )

    return materials
  } catch (err) {
    console.error('Get group materials error:', err.message)
    throw err
  }
}

export {
  generatePodcast,
  formatForPodcast,
  transcribeAudio,
  generateEnhancedFlashcards,
  getSpacedRepetitionPlan,
  createStudyGroup,
  shareWithGroup,
  getGroupMaterials
}
