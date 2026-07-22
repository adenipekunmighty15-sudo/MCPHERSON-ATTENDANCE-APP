import DOMPurify from 'dompurify'

DOMPurify.setConfig({
  ALLOWED_TAGS: [
    'a', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'pre', 'code', 'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
    'img', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'use',
  ],
  ALLOWED_ATTR: [
    'class', 'id', 'style', 'href', 'src', 'alt', 'title', 'width', 'height',
    'viewBox', 'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
    'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'points', 'transform', 'xmlns', 'clip-path', 'fill-rule',
  ],
  ALLOW_DATA_ATTR: false,
})

export function sanitizeHtml(input) {
  if (!input) return ''
  if (typeof input !== 'string') return String(input)
  return DOMPurify.sanitize(input)
}
