import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildBuiltinNotes,
  getCcmasCourse,
  getCcmasCourses,
  getCcmasOverview,
} from '../src/services/ccmasCatalog.js'
import ccmasRouter from '../src/routes/ccmas.routes.js'
import notesRouter from '../src/routes/notes.routes.js'

test('CCMAS catalog covers every mapped McPherson department', () => {
  const overview = getCcmasOverview()

  assert.equal(overview.departments.length, 20)
  assert.equal(overview.totalCourses, 795)
  assert.ok(overview.departments.some((item) => item.department === 'Computer Science' && item.courseCount === 38))
  assert.ok(overview.departments.some((item) => item.department === 'Nursing Science' && item.courseCount === 62))
  assert.equal(overview.source, 'NUC CCMAS 2023')
})

test('CCMAS courses can be filtered by department and search', () => {
  const computing = getCcmasCourses({ department: 'computer-science', limit: 200 })
  assert.equal(computing.total, 38)
  assert.ok(computing.courses.every((course) => course.department === 'Computer Science'))

  const search = getCcmasCourses({ search: 'Descriptive Statistics', limit: 20 })
  assert.ok(search.total >= 1)
  assert.ok(search.courses.some((course) => course.title === 'Descriptive Statistics'))
})

test('CCMAS course detail publishes real outcomes as inbuilt notes', () => {
  const result = getCcmasCourses({ search: 'Descriptive Statistics', limit: 1 })
  const course = getCcmasCourse(result.courses[0].id)

  assert.ok(course)
  assert.ok(course.outcomes.length >= 1)
  assert.ok(buildBuiltinNotes(course).includes('## Learning outcomes'))
  assert.ok(buildBuiltinNotes(course).includes(course.outcomes[0]))
})

test('CCMAS and personal note endpoints are registered', () => {
  const paths = (router) => router.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path)

  const ccmasPaths = paths(ccmasRouter)
  const notePaths = paths(notesRouter)

  assert.ok(ccmasPaths.includes('/api/ccmas/overview'))
  assert.ok(ccmasPaths.includes('/api/ccmas/courses'))
  assert.ok(ccmasPaths.includes('/api/ccmas/courses/:id'))
  assert.ok(notePaths.includes('/api/course-notes'))
  assert.ok(notePaths.includes('/api/course-notes/:id'))
})
