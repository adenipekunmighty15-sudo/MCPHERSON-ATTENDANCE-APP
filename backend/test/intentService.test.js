import test from 'node:test'
import assert from 'node:assert/strict'
import { isTrivialMessage } from '../src/services/intentService.js'

test('short greetings and acknowledgements are answered directly', () => {
  for (const message of ['hi', 'hello there', 'Good morning!', 'thanks', 'Thank you so much', 'okay', 'got it', 'how are you?', 'who are you?']) {
    assert.equal(isTrivialMessage(message), true, `${message} should be trivial`)
  }
})

test('substantive questions still use the full AI court', () => {
  for (const message of [
    'hi, solve this integral',
    'hello, explain photosynthesis',
    'no, explain why the answer is wrong',
    'thanks, but compare these two approaches',
    'yes and what should I do next?',
    'explain photosynthesis',
  ]) {
    assert.equal(isTrivialMessage(message), false, `${message} should not be trivial`)
  }
})
