// Single-tenant configuration for McPherson University.
//
// The application supports exactly one university in its initial deployment.
// The shape stays configuration-driven (domains, departments, ID rules) so the
// same authentication flow can be extended later without rewriting the UI.

export const universities = [
  {
    id: 'mcp',
    name: 'McPherson University',
    shortName: 'McPherson',
    shortCode: 'MCU',
    tagline: 'Citadel of Champions',
    allowedEmailDomains: ['mcu.edu.ng', 'undergraduate.mcu.edu.ng', 'mcpherson.edu', 'gmail.com'],
    departments: [
      // College of Computing
      { id: 'cs', code: 'CSC', name: 'Computer Science', college: 'COLCOM', aliases: ['CS', 'Computing'] },
      { id: 'se', code: 'SWE', name: 'Software Engineering', college: 'COLCOM', aliases: ['SE'] },
      { id: 'it', code: 'IFT', name: 'Information Technology', college: 'COLCOM', aliases: ['IT', 'ICT'] },
      { id: 'cyber', code: 'CYS', name: 'Cybersecurity', college: 'COLCOM', aliases: ['CYB', 'Cyber Security'] },
      { id: 'ds', code: 'DTS', name: 'Data Science', college: 'COLCOM', aliases: ['DS'] },

      // College of Allied Health Sciences
      { id: 'nursing', code: 'NUR', name: 'Nursing Science', college: 'COAHS', aliases: ['NUR', 'Nursing'] },
      { id: 'mls', code: 'MLS', name: 'Medical Laboratory Science', college: 'COAHS', aliases: ['MLT', 'Medical Laboratory Technology'] },
      { id: 'pubhealth', code: 'PHT', name: 'Public Health', college: 'COAHS', aliases: ['PH'] },
      { id: 'him', code: 'HIM', name: 'Health Information Management', college: 'COAHS', aliases: ['Health Informatics'] },

      // College of Natural and Applied Sciences
      { id: 'bio', code: 'BIO', name: 'Biological Sciences', college: 'COLNAS', aliases: ['Biology'] },
      { id: 'micro', code: 'MCB', name: 'Microbiology', college: 'COLNAS', aliases: [] },
      { id: 'biotech', code: 'BTE', name: 'Biotechnology', college: 'COLNAS', aliases: [] },
      { id: 'chem', code: 'CHS', name: 'Chemical Sciences', college: 'COLNAS', aliases: ['Chemistry'] },
      { id: 'bioch', code: 'BCH', name: 'Biochemistry & Molecular Biology', college: 'COLNAS', aliases: ['Biochemistry', 'BCHM'] },
      { id: 'ich', code: 'ICH', name: 'Industrial Chemistry', college: 'COLNAS', aliases: [] },
      { id: 'pms', code: 'PMS', name: 'Physical & Mathematical Sciences', college: 'COLNAS', aliases: ['Physical Sciences'] },
      { id: 'math', code: 'MTH', name: 'Industrial Mathematics', college: 'COLNAS', aliases: ['Mathematics', 'MATH'] },
      { id: 'physics', code: 'PHY', name: 'Physics with Electronics', college: 'COLNAS', aliases: ['Physics', 'Physics Electronics'] },
      { id: 'medphys', code: 'MDP', name: 'Medical Physics', college: 'COLNAS', aliases: [] },
      { id: 'stats', code: 'STA', name: 'Statistics', college: 'COLNAS', aliases: [] },

      // College of Humanities, Social and Management Sciences
      { id: 'acc', code: 'ACC', name: 'Accounting', college: 'COHSMAS', aliases: ['Accountancy'] },
      { id: 'bnkfin', code: 'BFN', name: 'Banking & Finance', college: 'COHSMAS', aliases: ['Banking and Finance', 'Finance'] },
      { id: 'busadmin', code: 'BUS', name: 'Business Administration', college: 'COHSMAS', aliases: ['Business Management', 'Management'] },
      { id: 'mkt', code: 'MKT', name: 'Marketing', college: 'COHSMAS', aliases: [] },
      { id: 'econs', code: 'ECO', name: 'Economics', college: 'COHSMAS', aliases: [] },
      { id: 'ir', code: 'IR', name: 'International Relations', college: 'COHSMAS', aliases: [] },
      { id: 'masscomm', code: 'MAC', name: 'Mass Communication', college: 'COHSMAS', aliases: ['Mass Communications'] },
      { id: 'his', code: 'HIS', name: 'History & International Studies', college: 'COHSMAS', aliases: ['History'] },
      { id: 'lang', code: 'ENG', name: 'English and Literary Studies', college: 'COHSMAS', aliases: ['English', 'Languages (English)', 'Literature'] },
      { id: 'rels', code: 'RPS', name: 'Religion & Peace Studies', college: 'COHSMAS', aliases: ['Religious Studies', 'Peace Studies'] },
      { id: 'pol', code: 'POL', name: 'Political Science', college: 'COHSMAS', aliases: [] },
      { id: 'psy', code: 'PSY', name: 'Psychology', college: 'COHSMAS', aliases: [] },
      { id: 'soc', code: 'SOC', name: 'Sociology', college: 'COHSMAS', aliases: [] },
      { id: 'gns', code: 'GNS', name: 'General Studies', college: 'COHSMAS', aliases: ['General Studies Programme'] },

      // College of Law
      { id: 'law', code: 'LAW', name: 'Law', college: 'COLLAW', aliases: ['Legal Studies'] },

      // Postgraduate Studies
      { id: 'postgrad', code: 'PGS', name: 'Postgraduate Studies', college: 'POSTGRAD', aliases: ['Postgraduate', 'Graduate Studies'] },
    ],
    idFormatRegex: /^[A-Za-z0-9][A-Za-z0-9/_-]{2,23}$/,
    role: 'student',
  },
]

// Convenience export used by the authentication screen. There is exactly one
// tenant today, so callers never need to resolve it from a selector.
export const university = universities[0]

export const colleges = [
  { code: 'COLCOM', name: 'College of Computing', shortName: 'COLCOM', aliases: ['Computing', 'College of Computer Science'] },
  { code: 'COAHS', name: 'College of Allied Health Sciences', shortName: 'COAHS', aliases: ['COLAHS', 'College of Basic Medical Sciences', 'Basic Medical Sciences'] },
  { code: 'COLNAS', name: 'College of Natural and Applied Sciences', shortName: 'COLNAS', aliases: ['Natural Sciences', 'Applied Sciences'] },
  { code: 'COHSMAS', name: 'College of Humanities, Social and Management Sciences', shortName: 'COHSMAS', aliases: ['Humanities', 'Social Sciences', 'Management Sciences'] },
  { code: 'COLLAW', name: 'College of Law', shortName: 'COLLAW', aliases: ['Law'] },
  { code: 'POSTGRAD', name: 'Postgraduate Studies', shortName: 'PG', aliases: ['Postgraduate', 'Graduate Studies'] },
]

export const departments = university.departments

export function getUniversity(id = university.id) {
  return universities.find((entry) => entry.id === id) || university
}

// Kept for backwards compatibility with older imports. A single-tenant build
// always resolves to McPherson University.
export function getCurrentUniversity() {
  return university
}

export function setCurrentUniversity() {
  // No tenant switching in a single-university deployment. Remove any stale
  // selector value left behind by previous builds.
  try {
    localStorage.removeItem('currentUniversity')
  } catch {
    // localStorage can be unavailable in private/sandboxed contexts.
  }
}

export function getCollege(code) {
  return colleges.find((college) => college.code === code)
}

export function getDepartmentByCode(code) {
  const candidate = String(code || '').trim().toLowerCase()
  return departments.find((department) =>
    [department.code, department.id, ...department.aliases]
      .some((value) => String(value).toLowerCase() === candidate))
}

export function getDepartmentByName(name) {
  const candidate = String(name || '').trim().toLowerCase()
  return departments.find((department) =>
    [department.name, department.code, department.id, ...department.aliases]
      .some((value) => String(value).toLowerCase() === candidate))
}

export function searchDepartments(query) {
  const term = String(query || '').trim().toLowerCase()
  if (!term) return departments

  return departments.filter((department) => {
    const college = getCollege(department.college)
    const searchable = [
      department.name,
      department.code,
      department.id,
      ...department.aliases,
      college?.name,
      college?.shortName,
      college?.code,
      ...(college?.aliases || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return searchable.includes(term)
  })
}

export function getUniversityDepartments() {
  return university.departments
}

export function getUniversityEmailDomains() {
  return university.allowedEmailDomains
}

export function getUniversityIdFormatRegex() {
  return university.idFormatRegex
}
