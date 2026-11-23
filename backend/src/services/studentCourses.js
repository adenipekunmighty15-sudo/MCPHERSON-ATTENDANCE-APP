import { query } from '../../lib/db.js'
import { getCcmasCourse, getCcmasCourses, getCcmasOverview } from './ccmasCatalog.js'

function cleanText(value, fallback = '', max = 200) {
  return String(value ?? fallback).trim().slice(0, max)
}

function normalizeDepartment(value) {
  return cleanText(value, '', 120).toLowerCase().replace(/\s+/g, ' ')
}

export function findCcmasDepartment(name) {
  const needle = normalizeDepartment(name)
  if (!needle) return null
  const { departments } = getCcmasOverview()
  return departments.find((dept) => {
    const candidates = [dept.department, dept.slug, dept.programme]
      .map(normalizeDepartment)
      .filter(Boolean)
    return candidates.some((candidate) => candidate === needle || needle.includes(candidate) || candidate.includes(needle))
  }) || null
}

export async function getStudentProfile(userId) {
  const { rows } = await query(
    `SELECT u.id, u.department, u.department_id AS "departmentId", u.level, u.programme_id AS "programmeId",
            d.name AS "departmentName", d.code AS "departmentCode"
     FROM public.users u
     LEFT JOIN public.departments d ON d.id::text = u.department_id::text
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  )
  return rows[0] || null
}

export async function listSelectedCourses(userId) {
  const { rows } = await query(
    `SELECT id, ccmas_course_id AS "ccmasCourseId", course_code AS "courseCode",
            course_title AS "courseTitle", department, level, units, source, status,
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM public.student_course_selections
     WHERE user_id = $1 AND status <> 'dropped'
     ORDER BY level ASC NULLS LAST, course_code ASC`,
    [userId]
  )
  return rows
}

export function buildDepartmentCourseFeed(departmentName, level) {
  const dept = findCcmasDepartment(departmentName)
  if (!dept) return { department: null, courses: [] }

  const all = getCcmasCourses({ department: dept.slug, limit: 200, offset: 0 })
  let courses = [...all.courses]
  let offset = courses.length
  while (offset < all.total) {
    const page = getCcmasCourses({ department: dept.slug, limit: 200, offset })
    courses = courses.concat(page.courses)
    offset += page.courses.length
    if (!page.courses.length) break
  }

  const studentLevel = Number.parseInt(level, 10)
  const normalized = courses.map((course) => {
    const auto = !Number.isFinite(studentLevel) || course.level <= studentLevel
    return {
      id: course.id,
      ccmasCourseId: course.id,
      code: course.code,
      title: course.title,
      units: course.units,
      status: course.status,
      level: course.level,
      department: course.department,
      departmentSlug: course.departmentSlug,
      faculty: course.faculty,
      programme: course.programme,
      source: 'ccmas',
      auto,
      recommended: Number.isFinite(studentLevel) ? course.level === studentLevel : auto,
      selected: auto,
    }
  })

  return { department: dept, courses: normalized }
}

export async function addStudentCourse(userId, ccmasCourseId) {
  const course = getCcmasCourse(ccmasCourseId)
  if (!course) return { error: 'Course not found in the CCMAS catalog', status: 404 }

  const { rows } = await query(
    `INSERT INTO public.student_course_selections
      (user_id, ccmas_course_id, course_code, course_title, department, level, units, source, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'ccmas', 'selected')
     ON CONFLICT (user_id, ccmas_course_id)
     DO UPDATE SET status = 'selected', course_code = EXCLUDED.course_code,
       course_title = EXCLUDED.course_title, department = EXCLUDED.department,
       level = EXCLUDED.level, units = EXCLUDED.units, updated_at = NOW()
     RETURNING id, ccmas_course_id AS "ccmasCourseId", course_code AS "courseCode",
       course_title AS "courseTitle", department, level, units, source, status,
       created_at AS "createdAt", updated_at AS "updatedAt"`,
    [userId, course.id, course.code, course.title, course.department, course.level, course.units]
  )
  return { row: rows[0] }
}

export async function removeStudentCourse(userId, ccmasCourseId) {
  const { rowCount } = await query(
    `UPDATE public.student_course_selections
     SET status = 'dropped', updated_at = NOW()
     WHERE user_id = $1 AND ccmas_course_id = $2`,
    [userId, ccmasCourseId]
  )
  return rowCount > 0
}
