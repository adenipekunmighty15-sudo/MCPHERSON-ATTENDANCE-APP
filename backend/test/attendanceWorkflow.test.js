import test from 'node:test'
import assert from 'node:assert/strict'
import router from '../src/routes/attendance.routes.js'
import {
  canManageSession,
  isStaffRole,
  normalizeManualStatus,
} from '../src/services/attendanceWorkflow.js'

test('manual attendance accepts only supported statuses', () => {
  assert.equal(normalizeManualStatus(' Present '), 'present')
  assert.equal(normalizeManualStatus('LATE'), 'late')
  assert.equal(normalizeManualStatus('left_early'), 'left_early')
  assert.equal(normalizeManualStatus('typed_whatever'), null)
  assert.equal(normalizeManualStatus(''), null)
})

test('session management is limited to the owning lecturer or an administrator', () => {
  const session = { lecturer_id: 'lecturer-1' }

  assert.equal(canManageSession({ id: 'lecturer-1', role: 'lecturer' }, session), true)
  assert.equal(canManageSession({ id: 'lecturer-2', role: 'lecturer' }, session), false)
  assert.equal(canManageSession({ id: 'admin-1', role: 'admin' }, session), true)
  assert.equal(canManageSession({ id: 'super-1', role: 'super_admin' }, session), true)
  assert.equal(canManageSession({ id: 'student-1', role: 'student' }, session), false)
  assert.equal(canManageSession(null, session), false)
  assert.equal(isStaffRole('lecturer'), true)
  assert.equal(isStaffRole('student'), false)
})

test('attendance router exposes the Cubbes-style lecturer roster and marking flow', () => {
  const routes = router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).map((method) => method.toUpperCase()),
    }))

  assert.ok(routes.some((route) => route.path === '/api/sessions/:id/roster' && route.methods.includes('GET')))
  assert.ok(routes.some((route) => route.path === '/api/sessions/:id/attendance' && route.methods.includes('POST')))
  assert.ok(routes.some((route) => route.path === '/api/sessions/:id/checkin-code' && route.methods.includes('GET')))
  assert.ok(routes.some((route) => route.path.startsWith('/api/sessions/end/') && route.methods.includes('POST')))
})
