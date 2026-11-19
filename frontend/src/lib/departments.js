import { colleges, departments as universityDepartments } from '../data/university'

export { colleges }

export const departments = universityDepartments.map((department) => ({
  value: department.name,
  label: department.name,
  code: department.code,
  college: department.college,
}))
