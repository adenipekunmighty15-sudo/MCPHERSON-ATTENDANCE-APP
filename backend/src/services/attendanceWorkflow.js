export const MANUAL_ATTENDANCE_STATUSES = [
  'present',
  'late',
  'absent',
  'excused',
  'left_early',
]

export function normalizeManualStatus(value) {
  const status = String(value || '').toLowerCase().trim()
  return MANUAL_ATTENDANCE_STATUSES.includes(status) ? status : null
}

export function canManageSession(user, session) {
  if (!user || !session) return false
  if (['admin', 'super_admin'].includes(user.role)) return true
  const ownerId = session.lecturer_id ?? session.lecturerId
  return user.role === 'lecturer' && String(ownerId) === String(user.id)
}

export function isStaffRole(role) {
  return ['lecturer', 'admin', 'super_admin'].includes(role)
}
