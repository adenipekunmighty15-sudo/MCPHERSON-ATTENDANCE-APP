import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../../lib/db.js'
import { addStudentCourse, buildDepartmentCourseFeed, getStudentProfile, listSelectedCourses, removeStudentCourse } from '../services/studentCourses.js'
import { getCcmasCourse } from '../services/ccmasCatalog.js'

const router = Router()

router.get('/api/student-courses', authenticate, async (req, res) => {
  try {
    const profile = await getStudentProfile(req.user.id)
    const departmentName = profile?.departmentName || profile?.department || req.user.department || ''
    const level = profile?.level || req.user.level || ''
    const { department, courses } = buildDepartmentCourseFeed(departmentName, level)
    const selected = await listSelectedCourses(req.user.id)
    const selectedIds = new Set(selected.map((item) => item.ccmasCourseId))

    const dropped = await query(
      `SELECT ccmas_course_id AS "ccmasCourseId" FROM public.student_course_selections WHERE user_id = $1 AND status = 'dropped'`,
      [req.user.id]
    ).then(({ rows }) => new Set(rows.map((r) => r.ccmasCourseId))).catch(() => new Set())

    const merged = courses
      .filter((course) => !dropped.has(course.ccmasCourseId))
      .map((course) => ({
        ...course,
        selected: true,
        addedByStudent: selectedIds.has(course.ccmasCourseId),
        auto: course.auto !== false,
      }))

    for (const item of selected) {
      if (merged.some((course) => course.ccmasCourseId === item.ccmasCourseId)) continue
      const detail = getCcmasCourse(item.ccmasCourseId)
      merged.push({
        id: item.ccmasCourseId,
        ccmasCourseId: item.ccmasCourseId,
        code: item.courseCode || detail?.code || 'Course',
        title: item.courseTitle || detail?.title || 'Selected course',
        units: item.units ?? detail?.units ?? null,
        status: detail?.status || 'C',
        level: item.level ?? detail?.level ?? null,
        department: item.department || detail?.department || departmentName,
        departmentSlug: detail?.departmentSlug || '',
        faculty: detail?.faculty || '',
        programme: detail?.programme || '',
        source: item.source || 'ccmas',
        auto: false,
        recommended: false,
        selected: true,
        addedByStudent: true,
      })
    }

    merged.sort((a, b) => {
      const levelDiff = Number(a.level || 999) - Number(b.level || 999)
      if (levelDiff !== 0) return levelDiff
      return String(a.code).localeCompare(String(b.code))
    })

    res.status(200).json({
      department: department ? {
        name: department.department,
        slug: department.slug,
        faculty: department.faculty,
        programme: department.programme,
      } : { name: departmentName || '' },
      level: level || null,
      courses: merged,
      selectedCount: selected.length,
    })
  } catch (err) {
    console.error('Failed to load student courses:', err.message)
    res.status(500).json({ error: 'Failed to load your courses' })
  }
})

router.post('/api/student-courses', authenticate, async (req, res) => {
  try {
    const ccmasCourseId = String(req.body?.ccmasCourseId || req.body?.courseId || '').trim()
    if (!ccmasCourseId) return res.status(400).json({ error: 'A CCMAS course is required' })
    const result = await addStudentCourse(req.user.id, ccmasCourseId)
    if (result.error) return res.status(result.status || 400).json({ error: result.error })
    res.status(201).json(result.row)
  } catch (err) {
    console.error('Failed to add student course:', err.message)
    res.status(500).json({ error: 'Failed to add course' })
  }
})

router.delete('/api/student-courses/:ccmasCourseId', authenticate, async (req, res) => {
  try {
    const removed = await removeStudentCourse(req.user.id, req.params.ccmasCourseId)
    if (!removed) return res.status(404).json({ error: 'Course selection not found' })
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Failed to remove student course:', err.message)
    res.status(500).json({ error: 'Failed to remove course' })
  }
})

export default router
