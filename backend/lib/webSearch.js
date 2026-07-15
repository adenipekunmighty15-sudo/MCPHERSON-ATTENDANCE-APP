import axios from 'axios'
import * as cheerio from 'cheerio'

const TIMEOUT = 8000

const searchCache = new Map()
const CACHE_TTL = 120 * 1000

// Verification-specific cache (longer TTL for claim verification)
const VERIFICATION_CACHE = new Map()
const VERIFICATION_CACHE_TTL = 60 * 60 * 1000 // 1 hour

function getCached(key) {
  const entry = searchCache.get(key)
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data
  searchCache.delete(key)
  return null
}

function setCached(key, data) {
  if (data && data.length > 0) {
    searchCache.set(key, { data, time: Date.now() })
    if (searchCache.size > 200) {
      const oldest = [...searchCache.entries()].sort((a, b) => a[1].time - b[1].time)[0]
      if (oldest) searchCache.delete(oldest[0])
    }
  }
}

function getVerificationCached(key) {
  const entry = VERIFICATION_CACHE.get(key)
  if (entry && Date.now() - entry.time < VERIFICATION_CACHE_TTL) return entry.data
  VERIFICATION_CACHE.delete(key)
  return null
}

function setVerificationCached(key, data) {
  if (data && data.length > 0) {
    VERIFICATION_CACHE.set(key, { data, time: Date.now() })
    if (VERIFICATION_CACHE.size > 500) {
      const oldest = [...VERIFICATION_CACHE.entries()].sort((a, b) => a[1].time - b[1].time)[0]
      if (oldest) VERIFICATION_CACHE.delete(oldest[0])
    }
  }
}

// Prioritized authoritative domains
const AUTHORITATIVE_DOMAINS = [
  'wikipedia.org',
  'britannica.com',
  'nih.gov',
  'who.int',
  'cdc.gov',
  'gov.uk',
  'gov.au',
  'gov.ca',
  'europa.eu',
  'un.org',
  'unesco.org',
  'oecd.org',
  'mit.edu',
  'stanford.edu',
  'harvard.edu',
  'berkeley.edu',
  'cmu.edu',
  'arxiv.org',
  'pubmed.ncbi.nlm.nih.gov',
  'scholar.google.com',
  'developer.mozilla.org',
  'docs.microsoft.com',
  'cloud.google.com',
  'aws.amazon.com',
  'kubernetes.io',
  'docker.com',
  'github.com',
  'stackoverflow.com',
  'w3.org',
  'ietf.org',
  'rfc-editor.org',
  'reddit.com',
  'stackoverflow.com',
  'youtube.com',
  'github.com',
  'google.com',
]

function isAuthoritativeDomain(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    return AUTHORITATIVE_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain))
  } catch {
    return false
  }
}

function scoreResult(result) {
  let score = 0
  if (isAuthoritativeDomain(result.url)) score += 100
  if (result.title && result.title.length > 10) score += 10
  if (result.snippet && result.snippet.length > 50) score += 20
  // Prefer recent content
  if (result.snippet && /202[4-6]/.test(result.snippet)) score += 15
  return score
}

function formatForCitation(rawResult, index) {
  let domain = 'unknown'
  try {
    if (rawResult.url && rawResult.url.startsWith('http')) {
      domain = new URL(rawResult.url).hostname.replace('www.', '')
    }
  } catch {}
  return {
    citationId: index + 1,
    title: rawResult.title || 'Untitled',
    snippet: rawResult.snippet || '',
    url: rawResult.url || '',
    domain,
    authoritative: isAuthoritativeDomain(rawResult.url || '')
  }
}

export async function webSearch(query, maxResults = 8) {
  const cacheKey = `web:${query}:${maxResults}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  // Try multiple sources in parallel
  const allResults = await Promise.allSettled([
    searchDuckDuckGo(query, maxResults),
    searchDuckDuckGoHTML(query, maxResults),
    searchBing(query, maxResults),
    searchWikipedia(query, maxResults),
    searchGoogle(query, maxResults),
    searchReddit(query, maxResults),
    searchStackOverflow(query, maxResults),
    searchYouTube(query, maxResults),
  ])

  const results = []
  for (const result of allResults) {
    if (result.status === 'fulfilled' && result.value) {
      results.push(...result.value)
    }
  }

  // Deduplicate by URL
  const seen = new Set()
  const unique = results.filter(r => {
    const key = r.url.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Score and sort by authority
  const scored = unique.map(r => ({ ...r, score: scoreResult(r) }))
  scored.sort((a, b) => b.score - a.score)

  const final = scored.slice(0, maxResults).map(({ score, ...r }) => r)
  setCached(cacheKey, final)
  return final
}

export async function searchForVerification(claims, maxPerClaim = 3) {
  const results = {}
  for (const claim of claims) {
    const cacheKey = `verify:${claim}:${maxPerClaim}`
    const cached = getVerificationCached(cacheKey)
    if (cached) {
      results[claim] = cached
      continue
    }
    const raw = await webSearch(claim, maxPerClaim)
    const formatted = raw.map((r, i) => formatForCitation(r, i))
    setVerificationCached(cacheKey, formatted)
    results[claim] = formatted
  }
  return results
}

// ... rest of file unchanged

async function searchDuckDuckGo(query, maxResults) {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept: 'text/html',
    },
    timeout: TIMEOUT,
  })
  const $ = cheerio.load(data)
  const results = []
  $('.result').each((i, el) => {
    if (i >= maxResults) return false
    const title = $(el).find('.result__title a').text().trim()
    const snippet = $(el).find('.result__snippet').text().trim()
    const link = $(el).find('.result__title a').attr('href')
    if (title && snippet) {
      results.push({ title, snippet, url: link || '' })
    }
  })
  return results
}

async function searchDuckDuckGoHTML(query, maxResults) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'text/html',
    },
    timeout: TIMEOUT,
  })
  const $ = cheerio.load(data)
  const results = []
  $('.result').each((i, el) => {
    if (i >= maxResults) return false
    const title = $(el).find('.result__title').text().trim()
    const snippet = $(el).find('.snippet').text().trim()
    const link = $(el).find('.result__title a').attr('href')
    if (title) {
      results.push({ title, snippet: snippet || title, url: link || '' })
    }
  })
  return results
}

async function searchBing(query, maxResults) {
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${maxResults}`
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html',
      },
      timeout: TIMEOUT,
    })
    const $ = cheerio.load(data)
    const results = []
    $('li.b_algo').each((i, el) => {
      if (i >= maxResults) return false
      const title = $(el).find('h2 a').text().trim()
      const snippet = $(el).find('.b_caption p').text().trim()
      const link = $(el).find('h2 a').attr('href')
      if (title && snippet) {
        results.push({ title, snippet, url: link || '' })
      }
    })
    return results
  } catch {
    return []
  }
}

async function searchWikipedia(query, maxResults) {
  try {
    // Use Wikipedia API for direct access
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=${maxResults}`
    const { data } = await axios.get(searchUrl, { timeout: TIMEOUT })
    const results = []
    if (data.query?.search) {
      for (const item of data.query.search) {
        const title = item.title
        const snippet = item.snippet.replace(/<[^>]*>/g, '').trim()
        const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`
        if (title && snippet) {
          results.push({ title, snippet, url })
        }
      }
    }
    return results
  } catch {
    return []
  }
}

async function searchGoogle(query, maxResults) {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${maxResults}`
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'text/html' },
      timeout: TIMEOUT,
    })
    const $ = cheerio.load(data)
    const results = []
    $('div.g, div[data-sokoban-container]').each((i, el) => {
      if (i >= maxResults) return false
      const title = $(el).find('h3').text().trim()
      const snippet = $(el).find('div[data-sncf], div.VwiC3b, span.aCOpRe').text().trim()
      const link = $(el).find('a').attr('href')
      if (title && link && link.startsWith('http')) {
        results.push({ title, snippet: snippet || title, url: link })
      }
    })
    return results
  } catch {
    return []
  }
}

async function searchReddit(query, maxResults) {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${maxResults}&sort=relevance&t=year`
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StudyBot/1.0)' },
      timeout: TIMEOUT,
    })
    const results = []
    if (data?.data?.children) {
      for (const child of data.data.children) {
        const post = child.data
        if (post.title && post.selftext) {
          results.push({
            title: post.title,
            snippet: post.selftext.slice(0, 300),
            url: `https://reddit.com${post.permalink}`,
          })
        }
      }
    }
    return results.slice(0, maxResults)
  } catch {
    return []
  }
}

async function searchStackOverflow(query, maxResults) {
  try {
    const url = `https://api.stackexchange.com/2.3/search/advanced?q=${encodeURIComponent(query)}&order=desc&sort=relevance&site=stackoverflow&pagesize=${maxResults}`
    const { data } = await axios.get(url, { timeout: TIMEOUT })
    const results = []
    if (data?.items) {
      for (const item of data.items) {
        results.push({
          title: item.title || '',
          snippet: (item.body || '').replace(/<[^>]*>/g, '').slice(0, 300),
          url: item.link || '',
        })
      }
    }
    return results
  } catch {
    return []
  }
}

async function searchYouTube(query, maxResults) {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'text/html' },
      timeout: TIMEOUT,
    })
    const results = []
    const titleRegex = /"title":\s*\{"runs":\s*\[\{"text":\s*"([^"]+)"/g
    const idRegex = /"videoId":\s*"([a-zA-Z0-9_-]{11})"/g
    const titles = []
    const ids = []
    let match
    while ((match = titleRegex.exec(data)) !== null) titles.push(match[1])
    while ((match = idRegex.exec(data)) !== null) ids.push(match[1])
    for (let i = 0; i < Math.min(titles.length, ids.length, maxResults); i++) {
      results.push({
        title: titles[i],
        snippet: `YouTube video: ${titles[i]}`,
        url: `https://www.youtube.com/watch?v=${ids[i]}`,
      })
    }
    return results
  } catch {
    return []
  }
}

export async function fetchPage(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      timeout: TIMEOUT + 5000,
      maxRedirects: 3,
    })
    const $ = cheerio.load(data)
    $('script, style, nav, footer, header, aside, iframe, noscript').remove()
    const title = $('title').text().trim()
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 12000)
    return { title, text, url }
  } catch {
    return null
  }
}

export function looksTimeSensitive(question) {
  const keywords = [
    'latest', 'current', 'today', 'yesterday', 'this week', 'this month',
    'breaking', 'news', 'update', 'now', 'recent', 'new', '2025', '2026',
    'live', 'trending', 'price', 'stock', 'weather', 'election',
    'score', 'result', 'announcement', 'release', 'upcoming',
    'who is', 'what is the current', 'tell me about',
  ]
  const lower = question.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

export async function searchImages(query, maxResults = 5) {
  const cacheKey = `img:${query}:${maxResults}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const results = await searchDuckDuckGo(query + ' image', maxResults)
    if (results.length > 0) { setCached(cacheKey, results); return results }
  } catch {}

  try {
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&count=${maxResults}`
    const { data } = await axios.get(bingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html',
      },
      timeout: TIMEOUT,
    })
    const bing$ = cheerio.load(data)
    const images = []
    bing$('img.mimg').each((i, el) => {
      if (i >= maxResults) return false
      const src = bing$(el).attr('src') || bing$(el).attr('data-src')
      const alt = bing$(el).attr('alt') || ''
      if (src && src.startsWith('http')) {
        images.push({ url: src, title: alt, source: 'bing' })
      }
    })
    if (images.length > 0) { setCached(cacheKey, images); return images }
  } catch {}

  return []
}
