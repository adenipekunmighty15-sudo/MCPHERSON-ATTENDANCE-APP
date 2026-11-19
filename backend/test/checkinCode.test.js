import test from 'node:test'
import assert from 'node:assert/strict'
import {
  generateCheckinCode,
  getCheckinKey,
  verifyCheckinCode,
} from '../src/services/checkinCode.js'

const keyValue = '0123456789abcdef'.repeat(4)
const key = getCheckinKey(keyValue)

test('check-in code is session-bound and valid for its rotation window', () => {
  const now = 1_800_000_000_000
  const { code, expiresAt } = generateCheckinCode('session-a', key, now)

  assert.equal(verifyCheckinCode('session-a', code, key, now), true)
  assert.equal(verifyCheckinCode('session-b', code, key, now), false)
  assert.equal(verifyCheckinCode('session-a', code, key, now + 60_000), false)
  assert.equal(expiresAt, new Date((Math.floor(now / 30_000) + 1) * 30_000).toISOString())
})

test('check-in code validation rejects malformed codes and secrets', () => {
  assert.equal(verifyCheckinCode('session-a', '12345', key), false)
  assert.throws(() => getCheckinKey('short'), /32-byte hexadecimal/)
})
