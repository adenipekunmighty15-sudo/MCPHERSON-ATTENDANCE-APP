import { YoutubeTranscript } from 'youtube-transcript'
import mammoth from 'mammoth'
import { extname } from 'path'
import { PDFParse } from 'pdf-parse'

function normalizeExtractedText(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value.text === 'string') return value.text
  if (typeof value.value === 'string') return value.value
  if (Array.isArray(value.pages)) {
    return value.pages
      .map(page => typeof page?.text === 'string' ? page.text : '')
      .filter(Boolean)
      .join('\n\n')
  }
  return String(value)
}

async function getYouTubeTranscript(url) {
  try {
    const videoId = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([^&?#]+)/)?.[1]
    if (!videoId) return null
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    return transcript.map(t => t.text).join(' ')
  } catch (err) {
    console.error('YouTube transcript error:', err.message)
    return null
  }
}

async function extractTextFromDoc(buffer, originalName) {
  try {
    const ext = extname(originalName).toLowerCase()
    if (ext === '.pdf') {
      const parser = new PDFParse(buffer, { verbosity: 0 })
      try {
        const result = await parser.getText()
        return normalizeExtractedText(result)
      } finally {
        await parser.destroy?.()
      }
    } else if (ext === '.docx' || ext === '.doc') {
      const data = await mammoth.extractRawText({ buffer })
      return normalizeExtractedText(data)
    } else if (['.txt', '.csv', '.rtf'].includes(ext)) {
      return normalizeExtractedText(buffer.toString())
    }
  } catch (err) {
    console.error('Text extraction error:', err.message)
  }
  return null
}

export { getYouTubeTranscript, extractTextFromDoc }
