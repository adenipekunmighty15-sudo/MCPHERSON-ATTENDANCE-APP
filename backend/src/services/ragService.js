import OpenAI from 'openai'
import { randomUUID } from 'crypto'
import { query } from '../../lib/db.js'
import { getAiResponse, getAvailableProviders, NVIDIA_EMBED_MODEL } from '../config/ai.js'

const LEGACY_EMBED_MODEL = 'nvidia/nv-embed-v1'
let embedder
let embedderKey = ''
let embedderModel = ''

function getEmbedder(apiKey, model) {
  if (!apiKey) throw new Error('Semantic search is unavailable until an NVIDIA embedding key is configured.')
  if (!embedder || embedderKey !== apiKey || embedderModel !== model) {
    embedder = new OpenAI({ apiKey, baseURL: 'https://integrate.api.nvidia.com/v1' })
    embedderKey = apiKey
    embedderModel = model
  }
  return embedder
}

async function createEmbedding(apiKey, model, text, inputType) {
  const resp = await getEmbedder(apiKey, model).embeddings.create({
    input: [text],
    model,
    input_type: inputType,
  })
  const embedding = resp.data?.[0]?.embedding
  if (!Array.isArray(embedding)) throw new Error('Embedding provider returned no vector.')
  // Public.ai_embeddings uses vector(2048). Never send a larger vector to it.
  if (embedding.length !== 2048) {
    throw new Error(`Embedding model ${model} returned ${embedding.length} dimensions; 2048 required.`)
  }
  return embedding
}

export async function embedText(text, inputType = 'passage') {
  const masterKey = process.env.NVIDIA_API_KEY
  if (masterKey) {
    try {
      return await createEmbedding(
        masterKey,
        process.env.NVIDIA_EMBED_MODEL || NVIDIA_EMBED_MODEL,
        text,
        inputType
      )
    } catch (err) {
      console.warn(`Master-key embedding failed (${err.message}); trying legacy embedder.`)
    }
  }
  const legacyKey = process.env.NV_EMBEDDER_KEY
  if (legacyKey) return createEmbedding(legacyKey, LEGACY_EMBED_MODEL, text, inputType)
  throw new Error('Semantic search is unavailable until NVIDIA_API_KEY or NV_EMBEDDER_KEY is configured.')
}

/**
 * The dedicated NeMo reranker is not reachable on this NVIDIA plan, so use the
 * master reasoning model to score retrieved passages. This is a real model
 * call, not a simulated score; failures fall back to vector order.
 */
export async function rerankPassages(queryText, passages, limit = 5) {
  if (!Array.isArray(passages) || passages.length === 0) return []
  if (!process.env.NVIDIA_API_KEY) return passages.slice(0, limit)

  const payload = {
    query: queryText,
    passages: passages.map((p, index) => ({ index, title: p.title || '', content: String(p.content || '').slice(0, 1200) })),
  }
  try {
    const raw = await getAiResponse('nvidia', [
      {
        role: 'system',
        content: 'You rank search passages by relevance. Return ONLY a JSON array of passage indices, best first, with no markdown and no explanation.',
      },
      { role: 'user', content: JSON.stringify(payload) },
    ], { temperature: 0, max_tokens: 1024 })
    const cleaned = String(raw || '').replace(/```json|```/gi, '').trim()
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) return passages.slice(0, limit)
    const ranked = parsed
      .map(index => passages[Number(index)])
      .filter(Boolean)
    return ranked.length ? ranked.slice(0, limit) : passages.slice(0, limit)
  } catch (err) {
    console.warn(`LLM rerank failed: ${err.message}; using vector order.`)
    return passages.slice(0, limit)
  }
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

export async function searchSimilar(userId, queryText, limit = 5, { rerank = false } = {}) {
  const embedding = await embedText(queryText, 'query')
  // Over-fetch when reranking so the model can choose from a wider candidate pool.
  const candidateLimit = rerank ? Math.min(Math.max(limit * 3, 10), 30) : limit
  const { rows } = await query(
    `SELECT id, content, title, type, source_id, metadata,
            1 - (embedding <=> $1::vector) AS similarity
     FROM public.ai_embeddings
     WHERE user_id = $2
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [JSON.stringify(embedding), userId, candidateLimit]
  )
  return rerank ? rerankPassages(queryText, rows, limit) : rows
}

export async function ragChat(userId, queryText, chatHistory = []) {
  const results = await searchSimilar(userId, queryText, 5, { rerank: true })
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
