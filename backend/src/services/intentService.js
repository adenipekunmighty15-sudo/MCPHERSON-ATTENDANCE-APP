/**
 * Lightweight, deterministic intent check used before the expensive AI court.
 * Greetings and short acknowledgements are answered by a single real model
 * with a plain system prompt — they must not trigger court roleplay.
 */
const TRIVIAL_PATTERNS = [
  /^(?:hi|hey|hello|hiya|howdy|yo|greetings|salam|good\s+(?:morning|afternoon|evening|day))(?:\s+(?:there|everyone|team))?[\s!.,~]*$/i,
  /^(?:thank\s+you(?:\s+(?:so\s+much|a\s+lot))?|thanks(?:\s+(?:so\s+much|a\s+lot))?|cheers)[\s!.,~]*$/i,
  /^(?:ok|okay|k|got\s+it|noted|sure|yep|nope|yes|no|nice|cool|great|fine|alright)[\s!.,~]*$/i,
  /^(?:how\s+are\s+you|how'?s\s+it\s+going|what'?s\s+up|how\s+do\s+you\s+do|you\s+good)[\s?]*$/i,
  /^(?:who\s+are\s+you|what\s+can\s+you\s+do)[\s?]*$/i,
]

export function isTrivialMessage(raw) {
  if (typeof raw !== 'string') return false
  const text = raw.trim()
  if (!text || text.length > 80) return false
  return TRIVIAL_PATTERNS.some((pattern) => pattern.test(text))
}
