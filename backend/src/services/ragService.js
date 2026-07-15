import OpenAI from 'openai'
import { randomUUID } from 'crypto'
import { query } from '../../lib/db.js'
import { getAiResponse, getAvailableProviders } from '../config/ai.js'

const embedder = new OpenAI({
  apiKey: process.env.NV_EMBEDDER_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
})

const EMBED_MODEL = 'nvidia/nv-embed-v1'
const VECTOR_DIM = parseInt(process.env.VECTOR_DIMENSION || '2048')

export async function embedText(text, inputType = 'passage') {
  if (process.env.AI_SAFE_MODE === 'true') {
    return Array.from({ length: VECTOR_DIM }, () => Math.random() * 2 - 1)
  }
  const resp = await embedder.embeddings.create({
    input: [text],
    model: EMBED_MODEL,
    input_type: inputType,
  })
  return resp.data[0].embedding
}

export async function indexContent(userId, content, metadata = {}) {
  const { title, type, sourceId } = metadata
  const embedding = await embedText(content, 'passage')
  const id = randomUUID()
  await query(
    `INSERT INTO public.ai_embeddings (id, user_id, content, title, type, source_id, metadata, embedding, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, NOW())`,
    [id, userId, content, title || '', type || 'general', sourceId || '', JSON.stringify(metadata), JSON.stringify(embedding)]
  )
  return id
}

export async function searchSimilar(userId, queryText, limit = 5) {
  const embedding = await embedText(queryText, 'query')
  const { rows } = await query(
    `SELECT id, content, title, type, source_id, metadata,
            1 - (embedding <=> $1::vector) AS similarity
     FROM public.ai_embeddings
     WHERE user_id = $2
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [JSON.stringify(embedding), userId, limit]
  )
  return rows
}

export async function ragChat(userId, queryText, chatHistory = []) {
  if (process.env.AI_SAFE_MODE === 'true') {
    return {
      response: 'This is a simulated RAG response (AI_SAFE_MODE is enabled). Your query was received and relevant content was found in the knowledge base.',
      citations: [],
      sources: [],
    }
  }

  const results = await searchSimilar(userId, queryText)
  const context = results.map(r =>
    `[${r.title}] (relevance: ${(r.similarity * 100).toFixed(1)}%): ${r.content}`
  ).join('\n\n')

  const citations = results
    .filter(r => r.similarity > 0.5)
    .map(r => ({
      title: r.title,
      snippet: r.content.slice(0, 200),
      similarity: r.similarity,
      sourceId: r.source_id,
    }))

  const systemPrompt = `You are a RAG-powered academic assistant for McPherson University. Use the retrieved content below to answer the student's question accurately. If the retrieved content is insufficient, say so clearly.

RETRIEVED CONTEXT:
${context || 'No relevant content found in the knowledge base.'}

Instructions:
- Answer based strictly on the retrieved content.
- Cite the source title when referencing specific information.
- If no relevant context exists, acknowledge and provide a general answer.
- Keep responses concise, clear, and academically helpful.`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-10),
    { role: 'user', content: queryText },
  ]

  const providers = getAvailableProviders()
  let response = null

  for (const p of ['nvidia-ultra', 'gemini', 'openai', 'mistral-large', ...providers]) {
    const resp = await getAiResponse(p, messages, { temperature: 0.3 })
    if (resp) {
      response = resp
      break
    }
  }

  return {
    response: response || "I couldn't find an answer to your question. Please try rephrasing.",
    citations,
    sources: results.map(r => ({ title: r.title, type: r.type, similarity: r.similarity })),
  }
}
