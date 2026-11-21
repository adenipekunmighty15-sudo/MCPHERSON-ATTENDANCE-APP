import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8')

test('AI stream never sends thinking or a fabricated fallback answer', () => {
  const source = read('src/routes/ai.routes.js')

  assert.doesNotMatch(source, /sendEvent\('thinking'/)
  assert.doesNotMatch(source, /I was unable to generate a complete response/)
  assert.doesNotMatch(source, /thinking:\s*finalThinking/)
  assert.match(source, /publicCouncil\(result\.council\)/)
})

test('study chat does not expose internal thinking fields', () => {
  const source = read('src/routes/study.routes.js')

  assert.doesNotMatch(source, /finalThinking:\s*result\.finalThinking/)
  assert.match(source, /provider: item\?\.provider, name: item\?\.name, role: item\?\.role, answer: item\?\.answer/)
})
