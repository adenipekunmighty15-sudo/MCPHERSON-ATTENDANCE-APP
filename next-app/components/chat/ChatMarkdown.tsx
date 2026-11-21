import type { ReactNode } from 'react'

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }

function tokenize(line: string): InlineToken[] {
  const tokens: InlineToken[] = []
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > cursor) tokens.push({ type: 'text', value: line.slice(cursor, match.index) })
    const value = match[0]
    if (value.startsWith('`')) tokens.push({ type: 'code', value: value.slice(1, -1) })
    else if (value.startsWith('**')) tokens.push({ type: 'bold', value: value.slice(2, -2) })
    else tokens.push({ type: 'italic', value: value.slice(1, -1) })
    cursor = match.index + value.length
  }

  if (cursor < line.length) tokens.push({ type: 'text', value: line.slice(cursor) })
  return tokens
}

function renderInline(line: string, keyPrefix: string): ReactNode[] {
  return tokenize(line).map((token, index) => {
    const key = `${keyPrefix}-${index}`
    if (token.type === 'code') return <code key={key} className="chatInlineCode">{token.value}</code>
    if (token.type === 'bold') return <strong key={key}>{token.value}</strong>
    if (token.type === 'italic') return <em key={key}>{token.value}</em>
    return <span key={key}>{token.value}</span>
  })
}

/** Minimal, safe Markdown renderer — no raw HTML is ever injected. */
export default function ChatMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index += 1
      continue
    }

    if (line.trimStart().startsWith('```')) {
      const language = line.trim().slice(3).trim()
      const code: string[] = []
      index += 1
      while (index < lines.length && !lines[index].trimStart().startsWith('```')) {
        code.push(lines[index])
        index += 1
      }
      index += 1
      blocks.push(
        <div key={`code-${blocks.length}`} className="chatCodeBlock">
          <span className="chatCodeLang">{language || 'code'}</span>
          <pre><code>{code.join('\n')}</code></pre>
        </div>,
      )
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      const Tag = (`h${Math.min(heading[1].length + 1, 5)}`) as 'h2' | 'h3' | 'h4' | 'h5'
      blocks.push(
        <Tag key={`heading-${blocks.length}`} className="chatHeading">
          {renderInline(heading[2], `heading-${blocks.length}`)}
        </Tag>,
      )
      index += 1
      continue
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, ''))
        index += 1
      }
      blocks.push(
        <ul key={`list-${blocks.length}`} className="chatList">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `list-${blocks.length}-${itemIndex}`)}</li>
          ))}
        </ul>,
      )
      continue
    }

    const paragraph: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trimStart().startsWith('```') &&
      !/^(#{1,4})\s+/.test(lines[index]) &&
      !/^\s*[-*]\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index])
      index += 1
    }
    blocks.push(
      <p key={`paragraph-${blocks.length}`} className="chatParagraph">
        {paragraph.map((text, textIndex) => (
          <span key={textIndex}>
            {textIndex > 0 ? <br /> : null}
            {renderInline(text, `paragraph-${blocks.length}-${textIndex}`)}
          </span>
        ))}
      </p>,
    )
  }

  return <div className="chatMarkdown">{blocks}</div>
}
