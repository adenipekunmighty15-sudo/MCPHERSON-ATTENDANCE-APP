const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'because', 'before', 'being', 'between',
  'could', 'during', 'every', 'from', 'have', 'into', 'more', 'most', 'other',
  'should', 'their', 'there', 'these', 'they', 'this', 'through', 'under',
  'where', 'which', 'while', 'with', 'would', 'your',
])

function splitSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 24)
}

function extractKeywords(text, limit = 12) {
  const counts = new Map()
  const words = String(text || '').toLowerCase().match(/[a-z][a-z-]{3,}/g) || []
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue
    counts.set(word, (counts.get(word) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word)
}

function buildStudyPack(sourceText, fc = 10, qc = 8, kpc = 6) {
  const fCount = Math.min(Math.max(parseInt(fc) || 10, 1), 50)
  const qCount = Math.min(Math.max(parseInt(qc) || 8, 1), 30)
  const kCount = Math.min(Math.max(parseInt(kpc) || 6, 1), 30)
  const sentences = splitSentences(sourceText)
  const keywords = extractKeywords(sourceText, Math.max(fCount, qCount, 8))
  const fallbackSentence = sentences[0] || String(sourceText || '').slice(0, 320)
  const summarySentences = sentences.slice(0, 5)

  const keyPoints = sentences.slice(0, kCount).map((sentence, index) => ({
    id: index + 1,
    text: sentence,
  }))

  const flashcards = keywords.slice(0, fCount).map((keyword, index) => {
    const match = sentences.find(sentence => sentence.toLowerCase().includes(keyword)) || sentences[index % sentences.length] || fallbackSentence
    return {
      id: index + 1,
      front: `What should you remember about ${keyword}?`,
      back: match,
    }
  })

  const quiz = keywords.slice(0, qCount).map((keyword, index) => {
    const answer = sentences.find(sentence => sentence.toLowerCase().includes(keyword)) || sentences[index % sentences.length] || fallbackSentence
    return {
      id: index + 1,
      question: `Which statement best explains ${keyword}?`,
      options: [
        answer,
        `It is unrelated to this lecture material.`,
        `It only applies outside this course.`,
        `It is only a file name, not a concept.`,
      ],
      answerIndex: 0,
      explanation: `The correct answer is taken from the lecture material and explains "${keyword}" in context.`,
    }
  })

  return {
    summary: summarySentences.join(' ') || String(sourceText || '').slice(0, 500),
    keyPoints,
    flashcards,
    quiz,
    diagrams: [],
    improvedNote: [
      '# Study Notes',
      '',
      '## Overview',
      summarySentences.join(' ') || fallbackSentence,
      '',
      '## Key Concepts',
      ...(keywords.length ? keywords.slice(0, kCount).map(keyword => `- **${keyword}:** ${sentences.find(sentence => sentence.toLowerCase().includes(keyword)) || fallbackSentence}`) : ['- Review the source material and identify the most repeated concepts.']),
      '',
      '## Detailed Notes',
      ...(sentences.length ? sentences.slice(0, 18).map(sentence => `- ${sentence}`) : [`- ${fallbackSentence}`]),
      '',
      '## Quick Review',
      '- Use the flashcards for active recall.',
      '- Take the quiz after one full reading.',
      '- Revisit any missed quiz explanation before moving on.',
    ].join('\n'),
  }
}

export { buildStudyPack, splitSentences, extractKeywords }
