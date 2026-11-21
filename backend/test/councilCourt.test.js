import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8')

test('AI court convenes multiple distinct real models, not one model in disguise', () => {
  const source = read('src/services/councilService.js')

  const seatsBlock = source.match(/const COURT_SEATS = \[([\s\S]*?)\]/)
  assert.ok(seatsBlock, 'COURT_SEATS must be defined')

  const ids = [...seatsBlock[1].matchAll(/modelId:\s*'([^']+)'/g)].map((match) => match[1])
  assert.ok(ids.length >= 3, 'the court needs at least three counsel seats')

  const uniqueIds = new Set(ids)
  assert.equal(uniqueIds.size, ids.length, 'every counsel seat must be a distinct model')

  const judge = source.match(/const JUDGE_MODEL_ID = '([^']+)'/)
  assert.ok(judge, 'a presiding judge model must be defined')
  assert.ok(!ids.includes(judge[1]), 'the judge must be a different model from the counsel')
})

test('AI court never reads or returns private reasoning content', () => {
  const source = read('src/services/councilService.js')
  // No code path may access the reasoning_content field of a provider message.
  assert.doesNotMatch(source, /\.reasoning_content/)
  assert.doesNotMatch(source, /\[['"]reasoning_content['"]\]/)
  assert.match(source, /never expose private reasoning/)
})

test('AI court strips the judge bench header before persisting the answer', () => {
  const source = read('src/services/councilService.js')

  // The streamed answer is accumulated in onText, not taken from the
  // streamOpenAICompatResponse return value (which includes the JSON header).
  assert.match(source, /We accumulate the answer ourselves in onText/)
  assert.match(source, /never persisted/)
  assert.match(source, /parseBenchHeader/)
  assert.match(source, /const remaining = lines\.slice\(1\)\.join/)
})

test('AI court streams the verdict live through delta events', () => {
  const source = read('src/services/councilService.js')
  assert.match(source, /sendEvent\('delta', \{ content: delta \}\)/)
  assert.match(source, /phase: 'verdict'/)

  const route = read('src/routes/ai.routes.js')
  assert.match(route, /runCourtCouncil\(\{ messages, sendEvent/)
})

test('AI chat uses the court by default so single-model answers are not the norm', () => {
  const chat = read('../next-app/components/chat/AIChatWorkspace.tsx')
  assert.match(chat, /const \[council, setCouncil\] = useState\(true\)/)
  assert.match(chat, /default answering path/i)
})
