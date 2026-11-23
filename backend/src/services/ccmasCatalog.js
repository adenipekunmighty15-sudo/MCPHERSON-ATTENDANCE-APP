import { readFileSync } from 'node:fs'

const CATALOG_PATH = new URL('../../data/ccmas-catalog.json', import.meta.url)
let cachedCatalog = null

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function courseIdentity(departmentSlug, code) {
  return `${departmentSlug}--${slugify(code)}`
}

function loadCatalog() {
  if (cachedCatalog) return cachedCatalog

  const source = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'))
  const departments = source.map((department) => {
    const slug = slugify(department.department)
    return {
      slug,
      department: department.department,
      faculty: department.faculty,
      programme: department.programme,
      degree: department.degree,
      sourceUrl: department.source_url,
      courseCount: department.courses.length,
    }
  })

  const courses = source.flatMap((department) => {
    const departmentSlug = slugify(department.department)
    return department.courses.map((course, index) => {
      const item = {
        id: courseIdentity(departmentSlug, course.code),
        code: course.code,
        title: course.title,
        units: course.units,
        status: course.status,
        level: course.level,
        contactHours: course.lh,
        practicalHours: course.ph,
        prerequisites: course.prerequisites,
        outcomesIntro: course.outcomes_intro,
        outcomes: course.outcomes || [],
        contents: course.contents || '',
        labWork: course.lab_work || '',
        sourcePage: course.page,
        department: department.department,
        departmentSlug,
        faculty: department.faculty,
        programme: department.programme,
        degree: department.degree,
        sourceUrl: department.source_url,
        order: index,
      }
      return { ...item, builtinNotes: buildBuiltinNotes(item) }
    })
  })

  cachedCatalog = { departments, courses }
  return cachedCatalog
}

export function getCcmasOverview() {
  const { departments, courses } = loadCatalog()
  return {
    departments,
    faculties: [...new Set(departments.map((item) => item.faculty))].sort(),
    totalCourses: courses.length,
    source: 'NUC CCMAS 2023',
  }
}

export function getCcmasCourses({ department = '', search = '', level = '', limit = 60, offset = 0 } = {}) {
  const { courses } = loadCatalog()
  const query = String(search || '').trim().toLowerCase()
  const departmentFilter = String(department || '').trim().toLowerCase()

  const filtered = courses.filter((course) => {
    if (departmentFilter && course.departmentSlug !== departmentFilter && course.department.toLowerCase() !== departmentFilter) return false
    if (level && String(course.level) !== String(level)) return false
    if (!query) return true
    return [course.code, course.title, course.contents, ...course.outcomes]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 60, 1), 200)
  const safeOffset = Math.max(Number.parseInt(offset, 10) || 0, 0)
  return {
    courses: filtered.slice(safeOffset, safeOffset + safeLimit),
    total: filtered.length,
    limit: safeLimit,
    offset: safeOffset,
  }
}

export function getCcmasCourse(id) {
  const { courses } = loadCatalog()
  return courses.find((course) => course.id === id) || null
}

export function buildBuiltinNotes(course) {
  if (!course) return ''
  const outcomes = course.outcomes.length
    ? course.outcomes.map((item) => `- ${item}`).join('\n')
    : '- No learning outcomes were published for this course.'

  return [
    `# ${course.code} — ${course.title}`,
    '',
    `**Department:** ${course.department}  `,
    `**Programme:** ${course.programme} (${course.degree})  `,
    `**Units:** ${course.units} · **Level:** ${course.level} · **Status:** ${course.status}`,
    '',
    '## Learning outcomes',
    outcomes,
    '',
    '## Course outline',
    course.contents || 'No outline content was published for this course.',
    course.labWork ? `\n## Practical work\n${course.labWork}` : '',
    '\n---',
    `Source: ${course.sourceUrl || 'NUC CCMAS 2023'} (page ${course.sourcePage || 'n/a'}).`,
  ].filter((part) => part !== '').join('\n')
}
