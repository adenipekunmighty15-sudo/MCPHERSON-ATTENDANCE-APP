import { webSearch, fetchPage } from '../../lib/webSearch.js'
import { getAvailableProviders, getAiResponse } from '../config/ai.js'

export async function deepResearch(query, depth = 'standard') {
  const maxRounds = depth === 'deep' ? 4 : 2
  const maxResults = depth === 'deep' ? 8 : 5

  // Round 1: Initial search
  const results = await webSearch(query, maxResults)
  if (!results.length) return { report: 'No results found.', sources: [] }

  const sources = results.map(r => ({ title: r.title, url: r.url, snippet: r.snippet }))

  // Round 2: Fetch top pages for depth
  let pageContents = []
  if (depth === 'deep') {
    const topPages = results.slice(0, 3)
    pageContents = (await Promise.allSettled(
      topPages.map(r => fetchPage(r.url).catch(() => null))
    )).filter(r => r.status === 'fulfilled' && r.value).map(r => r.value)
  }

  // Round 3: Identify knowledge gaps and search again
  let gapResults = []
  if (depth === 'deep' && results.length >= 2) {
    const gapQuery = `${query} ${results[0].snippet?.split(' ').slice(0, 5).join(' ') || ''} additional details`
    const more = await webSearch(gapQuery, 3)
    if (more.length) {
      gapResults = more.map(r => ({ title: r.title, url: r.url, snippet: r.snippet }))
      sources.push(...gapResults)
    }
  }

  // Synthesize report using AI
  const providers = getAvailableProviders()
  const synthProvider = providers.find(p => ['groq', 'openrouter', 'deepseek'].includes(p)) || providers[0]

  if (!synthProvider) {
    return {
      report: synthesizePlain(query, results, pageContents, gapResults),
      sources,
    }
  }

  const allContent = [
    ...results.map(r => `[Source: ${r.title}](${r.url})\n${r.snippet}`),
    ...(pageContents.length ? [`\n--- FULL PAGE CONTENT ---\n${pageContents.join('\n\n').slice(0, 8000)}`] : []),
    ...(gapResults.length ? [`\n--- ADDITIONAL SOURCES ---\n${gapResults.map(r => `${r.title}: ${r.snippet}`).join('\n')}`] : []),
  ].join('\n\n')

  const prompt = [
    { role: 'system', content: 'You are a senior research analyst. Synthesize the following search results into a comprehensive, well-structured research report. Include inline citations like [1], [2] referencing the sources below. Use ## headings for sections. Write in formal academic style with an introduction, main findings, and conclusion.' },
    { role: 'user', content: `Research Query: "${query}"\n\nSource Material:\n${allContent}\n\nProduce a thorough research report with inline citations.` },
  ]

  let report = ''
  try {
    const resp = await getAiResponse(synthProvider, prompt, { temperature: 0.2 })
    report = resp || synthesizePlain(query, results, pageContents, gapResults)
  } catch {
    report = synthesizePlain(query, results, pageContents, gapResults)
  }

  return { report, sources }
}

function synthesizePlain(query, results, pageContents, gapResults) {
  const parts = [`# Research Report: ${query}\n`]
  parts.push(`## Summary\nBased on ${results.length} sources, here is what was found:\n`)
  for (const r of results) {
    parts.push(`- **${r.title}**: ${r.snippet}`)
  }
  if (pageContents.length) {
    parts.push(`\n## Detailed Analysis\n${pageContents.join('\n\n').slice(0, 3000)}`)
  }
  if (gapResults.length) {
    parts.push(`\n## Additional Sources\n${gapResults.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}`)
  }
  parts.push(`\n---\n*Research conducted at ${new Date().toISOString()}*`)
  return parts.join('\n')
}
