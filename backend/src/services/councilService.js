import { getAI, streamOpenAICompatResponse, VERIFIED_MODELS } from '../config/ai.js'

/**
 * The court uses distinct verified models, not one model pretending to be a
 * panel. Five counsel answer in parallel; a sixth model acts as judge and
 * streams the final verdict. Every message shown to the user comes from a real
 * provider completion. No reasoning_content is read or returned.
 */
const COURT_SEATS = [
  { modelId: 'mistral-large-4-1t', role: 'Counsel for Accuracy' },
  { modelId: 'nemotron-3.5-bolt', role: 'Counsel for Clarity' },
  { modelId: 'step-5-preview', role: 'Counsel for Evidence' },
  { modelId: 'nemotron-3.5-super-vl', role: 'Counsel for Context' },
  { modelId: 'kimi-k3.1-pro', role: 'Counsel for Edge Cases' },
]

const JUDGE_MODEL_ID = 'nemotron-3-ultra'
const ADVOCATE_TIMEOUT_MS = Number(process.env.COUNCIL_ADVOCATE_TIMEOUT_MS || 9000)
const JUDGE_TIMEOUT_MS = Number(process.env.COUNCIL_JUDGE_TIMEOUT_MS || 20000)

const REASONING_ONLY = /^(?:<think\b|reasoning|analysis|thought process|thinking|let me think|i need to (?:think|reason))\b/i

function cleanAnswer(raw) {
  if (typeof raw !== 'string') return null
  const stripped = raw
    .replace(/^<think\b[^>]*>[\s\S]*?<\/think>\s*/i, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<\/?answer>/gi, '')
    .trim()
  if (!stripped || REASONING_ONLY.test(stripped)) return null
  return stripped
}

function seatFor(modelId) {
  const model = VERIFIED_MODELS.find((item) => item.id === modelId)
  if (!model) return null
  return {
    id: model.id,
    model: model.model,
    name: model.name,
    provider: model.provider,
  }
}

function withParentAbort(controller, parentSignal) {
  if (!parentSignal) return () => {}
  const abort = () => controller.abort()
  if (parentSignal.aborted) abort()
  else parentSignal.addEventListener('abort', abort, { once: true })
  return () => parentSignal.removeEventListener('abort', abort)
}

async function askCounsel(seat, messages, parentSignal) {
  const client = getAI('nvidia')
  if (!client) return null
  const controller = new AbortController()
  const detach = withParentAbort(controller, parentSignal)
  const timer = setTimeout(() => controller.abort(), ADVOCATE_TIMEOUT_MS)

  const counselMessages = [
    {
      role: 'system',
      content:
        `You are ${seat.role} in the McPherson AI court. Answer the student's question directly and accurately. ` +
        'Give the strongest answer you can from your own knowledge. Be concise, cite examples where useful, ' +
        'use LaTeX for math, and never expose private reasoning. Do not mention that you are in a panel.',
    },
    ...messages.filter((message) => message.role !== 'system').slice(-6),
  ]

  try {
    const completion = await client.chat.completions.create(
      {
        model: seat.model,
        messages: counselMessages,
        temperature: 0.35,
        max_tokens: 450,
      },
      { signal: controller.signal },
    )
    const content = completion.choices?.[0]?.message?.content
    return cleanAnswer(Array.isArray(content) ? content.map((part) => part?.text || '').join('') : content)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
    detach()
  }
}

function parseBenchHeader(raw) {
  const trimmed = String(raw || '').trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1].trim() : trimmed
  const objectMatch = candidate.match(/\{[\s\S]*?\}/)
  if (!objectMatch) return null
  try {
    const parsed = JSON.parse(objectMatch[0])
    if (typeof parsed.winner !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Runs the full court and streams the judge's answer through `sendEvent`.
 * Returns metadata for persistence; the answer itself is sent as delta events.
 */
export async function runCourtCouncil({ messages, sendEvent, signal }) {
  const seats = COURT_SEATS.map((seat) => ({ ...seat, ...seatFor(seat.modelId) })).filter((seat) => seat.model)
  const judge = seatFor(JUDGE_MODEL_ID)
  if (!judge || seats.length < 2) return null

  sendEvent('council', {
    phase: 'opened',
    message: `Convening ${seats.length} counsel with ${judge.name} presiding…`,
    members: seats.map((seat) => ({ id: seat.id, name: seat.name, role: seat.role })),
    judge: { id: judge.id, name: judge.name },
  })

  const answered = []
  await Promise.all(
    seats.map(async (seat, index) => {
      const answer = await askCounsel(seat, messages, signal)
      if (!answer) return
      const testimony = {
        index: index + 1,
        id: seat.id,
        name: seat.name,
        role: seat.role,
        model: seat.model,
        answer,
      }
      answered.push(testimony)
      answered.sort((a, b) => a.index - b.index)
      sendEvent('council', {
        phase: 'testimony',
        message: `${seat.role} has spoken.`,
        member: { id: seat.id, name: seat.name, role: seat.role },
        testimony,
        count: answered.length,
        total: seats.length,
      })
    }),
  )

  if (answered.length === 0) return null

  const testimonyText = answered
    .map((item) => `[${item.index}] ${item.name} (${item.role}):\n${item.answer}`)
    .join('\n\n')

  const judgeMessages = [
    {
      role: 'system',
      content:
        'You are the CHIEF JUSTICE of the McPherson AI court. Weigh the counsel testimonies below. ' +
        'Choose the single strongest answer and deliver one clear verdict to the student. ' +
        'First output ONLY a compact JSON object on one line: {"winner":<testimony number>,"rationale":"<short reason>"}. ' +
        'Then start a new line and write the final answer. Do not reveal private reasoning. ' +
        'Use LaTeX for math. The final answer must stand on its own.',
    },
    ...messages.filter((message) => message.role !== 'system').slice(-6),
    { role: 'user', content: `COUNSEL TESTIMONIES:\n\n${testimonyText}` },
  ]

  let buffer = ''
  let headerParsed = false
  let header = null
  let finalAnswer = ''

  const controller = new AbortController()
  const detach = withParentAbort(controller, signal)
  const timer = setTimeout(() => controller.abort(), JUDGE_TIMEOUT_MS)

  try {
    // We accumulate the answer ourselves in onText so the JSON bench header is
    // never persisted. streamOpenAICompatResponse's return value includes that
    // header, so it is intentionally ignored here.
    await streamOpenAICompatResponse('nvidia', judgeMessages, {
      signal: controller.signal,
      model: judge.model,
      temperature: 0.2,
      max_tokens: 1800,
      onText: (delta) => {
        if (!delta) return

        if (!headerParsed) {
          buffer += delta
          const lines = buffer.split('\n')
          const first = lines[0] || ''
          if (first.trim()) {
            header = parseBenchHeader(first)
            if (header) {
              headerParsed = true
              const winner = answered.find((item) => item.index === header.winner) || answered[0]
              sendEvent('council', {
                phase: 'verdict',
                message: `${judge.name} has delivered the verdict.`,
                judge: { id: judge.id, name: judge.name },
                winner: { id: winner.id, name: winner.name, role: winner.role, index: winner.index },
                rationale: String(header.rationale || '').slice(0, 500),
              })
              const remaining = lines.slice(1).join('\n')
              buffer = ''
              if (remaining) {
                finalAnswer += remaining
                sendEvent('delta', { content: remaining })
              }
              return
            }
          }
          // If the judge ignores the header format, stop buffering and stream
          // the text as the answer instead of holding it hostage.
          if (buffer.length > 600 || buffer.includes('\n\n')) {
            headerParsed = true
            const streamed = buffer
            buffer = ''
            finalAnswer += streamed
            sendEvent('delta', { content: streamed })
          }
          return
        }

        finalAnswer += delta
        sendEvent('delta', { content: delta })
      },
    })
  } catch {
    // A failed judge still leaves the real counsel answers available below.
  } finally {
    clearTimeout(timer)
    detach()
  }

  // If the header never completed but the judge still produced text, use it.
  if (!finalAnswer && buffer) finalAnswer = buffer
  let answer = cleanAnswer(finalAnswer)
  if (!answer) {
    const fallback = answered[0]
    answer = fallback.answer
    sendEvent('council', {
      phase: 'verdict',
      message: 'The judge did not return a usable verdict; the strongest counsel answer is used.',
      judge: { id: judge.id, name: judge.name },
      winner: { id: fallback.id, name: fallback.name, role: fallback.role, index: fallback.index },
      rationale: '',
    })
  }

  return {
    answer,
    judge: { id: judge.id, name: judge.name },
    winner: header ? answered.find((item) => item.index === header.winner) || answered[0] : null,
    rationale: header ? String(header.rationale || '').slice(0, 500) : '',
    council: answered,
  }
}
