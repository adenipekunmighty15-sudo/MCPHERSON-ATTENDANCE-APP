const TAG_WHITELIST = new Set([
  'a', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'pre', 'code', 'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
  'img', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'use',
])
const ATTR_WHITELIST = /^(class|id|style|href|src|alt|title|width|height|viewBox|d|fill|stroke|stroke-width|stroke-linecap|stroke-linejoin|x|y|cx|cy|r|rx|ry|points|transform|xmlns|clip-path|fill-rule)$/i
const PROTOCOL_WHITELIST = /^(https?|mailto|tel):/i

export function sanitizeHtml(input) {
  if (!input) return ''
  if (typeof input !== 'string') return String(input)
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*on\w+\s*=[^>]*>/gi, '')
    .replace(/<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi, (match, tag) => {
      if (!TAG_WHITELIST.has(tag.toLowerCase())) return ''
      const attrs = match.match(/(\S+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/g) || []
      const safe = attrs.filter(a => {
        const name = a.split('=')[0].toLowerCase()
        if (!ATTR_WHITELIST.test(name)) return false
        if (name === 'href' || name === 'src') {
          const val = a.split('=').slice(1).join('=').replace(/^["']|["']$/g, '')
          return PROTOCOL_WHITELIST.test(val)
        }
        return true
      })
      return `<${tag}${safe.length ? ' ' + safe.join(' ') : ''}>`
    })
    .replace(/<\/[^>]+>/g, (match) => {
      const tag = match.replace(/<\/|>/g, '').toLowerCase()
      return TAG_WHITELIST.has(tag) ? match : ''
    })
}
