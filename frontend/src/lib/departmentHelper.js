const departmentMap = {
  'CSC': 'Computer Science',
  'SWE': 'Software Engineering',
  'ICT': 'Information Technology',
  'CIS': 'Computer Information Systems',
  'SE': 'Software Engineering',
  'CS': 'Computer Science',
  'LAW': 'Law',
  'NUR': 'Nursing',
  'NSC': 'Nursing Science',
  'ACC': 'Accounting',
  'ECO': 'Economics',
  'MCB': 'Microbiology',
  'BCH': 'Biochemistry',
  'BIO': 'Biology',
  'CHM': 'Chemistry',
  'PHY': 'Physics',
  'MTH': 'Mathematics',
  'ENG': 'English',
  'HIS': 'History',
  'POL': 'Political Science',
  'PSY': 'Psychology',
  'SOC': 'Sociology',
  'BUS': 'Business Administration',
  'MGT': 'Management',
  'MKT': 'Marketing',
  'FIN': 'Finance',
  'EDU': 'Education',
  'ART': 'Arts',
  'MUS': 'Music',
  'PHE': 'Physical Education',
}

export function getDepartmentName(code) {
  if (!code) return 'Not assigned'
  const trimmed = code.trim()
  return departmentMap[trimmed.toUpperCase()] || trimmed
}
