import { departments } from '../data/university'

const departmentMap = {}

for (const department of departments) {
  const values = [department.name, department.code, department.id, ...department.aliases]
  for (const value of values) {
    if (value) departmentMap[String(value).trim().toUpperCase()] = department.name
  }
}

// Legacy aliases that still appear in older database rows.
const legacyAliases = {
  CIS: 'Computer Science',
  CSC: 'Computer Science',
  SE: 'Software Engineering',
  ICT: 'Information Technology',
  CS: 'Computer Science',
  NSC: 'Nursing Science',
  NUR: 'Nursing Science',
  BIO: 'Biological Sciences',
  CHM: 'Chemical Sciences',
  PHY: 'Physics with Electronics',
  MTH: 'Industrial Mathematics',
  ENG: 'English and Literary Studies',
  HIS: 'History & International Studies',
  POL: 'Political Science',
  PSY: 'Psychology',
  SOC: 'Sociology',
  MGT: 'Business Administration',
  FIN: 'Banking & Finance',
  EDU: 'General Studies',
  ART: 'English and Literary Studies',
  MUS: 'General Studies',
  PHE: 'General Studies',
}

for (const [code, name] of Object.entries(legacyAliases)) {
  if (!departmentMap[code]) departmentMap[code] = name
}

export function getDepartmentName(code) {
  if (!code) return 'Not assigned'
  const trimmed = String(code).trim()
  return departmentMap[trimmed.toUpperCase()] || trimmed
}
