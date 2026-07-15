// Mock database of courses for all departments from 100 to 500/600 level
export const allCourses = {
  'Computer Science': [
    { code: 'CSC 101', title: 'Introduction to Computer Science', level: 100, credits: 3 },
    { code: 'CSC 201', title: 'Computer Programming I', level: 200, credits: 3 },
    { code: 'CSC 301', title: 'Data Structures & Algorithms', level: 300, credits: 3 },
    { code: 'CSC 401', title: 'Artificial Intelligence', level: 400, credits: 3 },
    { code: 'CSC 501', title: 'Advanced Database Systems', level: 500, credits: 3 },
  ],
  'Software Engineering': [
    { code: 'SWE 101', title: 'Intro to Software Engineering', level: 100, credits: 3 },
    { code: 'SWE 201', title: 'Software Requirements', level: 200, credits: 3 },
    { code: 'SWE 301', title: 'Software Architecture', level: 300, credits: 3 },
    { code: 'SWE 401', title: 'Software Testing & QA', level: 400, credits: 3 },
    { code: 'SWE 501', title: 'Project Management', level: 500, credits: 3 },
  ],
  'Information Technology': [
    { code: 'ICT 101', title: 'Introduction to IT', level: 100, credits: 3 },
    { code: 'ICT 201', title: 'Web Development', level: 200, credits: 3 },
    { code: 'ICT 301', title: 'Network Administration', level: 300, credits: 3 },
    { code: 'ICT 401', title: 'Cybersecurity Principles', level: 400, credits: 3 },
    { code: 'ICT 501', title: 'Cloud Computing', level: 500, credits: 3 },
  ],
  'Law': [
    { code: 'LAW 101', title: 'Legal Method I', level: 100, credits: 4 },
    { code: 'LAW 201', title: 'Law of Contract I', level: 200, credits: 4 },
    { code: 'LAW 301', title: 'Criminal Law I', level: 300, credits: 4 },
    { code: 'LAW 401', title: 'Land Law I', level: 400, credits: 4 },
    { code: 'LAW 501', title: 'Jurisprudence I', level: 500, credits: 4 },
    { code: 'LAW 601', title: 'Advanced Legal Practice', level: 600, credits: 4 },
  ],
  'Nursing Science': [
    { code: 'NSC 101', title: 'Foundations of Nursing', level: 100, credits: 3 },
    { code: 'NSC 201', title: 'Human Anatomy', level: 200, credits: 4 },
    { code: 'NSC 301', title: 'Medical-Surgical Nursing', level: 300, credits: 4 },
    { code: 'NSC 401', title: 'Maternal & Child Health', level: 400, credits: 4 },
    { code: 'NSC 501', title: 'Community Health Nursing', level: 500, credits: 4 },
  ],
  'Accounting': [
    { code: 'ACC 101', title: 'Principles of Accounting', level: 100, credits: 3 },
    { code: 'ACC 201', title: 'Financial Accounting', level: 200, credits: 3 },
    { code: 'ACC 301', title: 'Cost Accounting', level: 300, credits: 3 },
    { code: 'ACC 401', title: 'Auditing and Assurance', level: 400, credits: 3 },
    { code: 'ACC 501', title: 'Advanced Taxation', level: 500, credits: 3 },
  ],
  'Economics': [
    { code: 'ECO 101', title: 'Principles of Microeconomics', level: 100, credits: 3 },
    { code: 'ECO 201', title: 'Principles of Macroeconomics', level: 200, credits: 3 },
    { code: 'ECO 301', title: 'Intermediate Microeconomics', level: 300, credits: 3 },
    { code: 'ECO 401', title: 'Econometrics I', level: 400, credits: 3 },
    { code: 'ECO 501', title: 'Development Economics', level: 500, credits: 3 },
  ],
  'Microbiology': [
    { code: 'MCB 101', title: 'Intro to Microbiology', level: 100, credits: 3 },
    { code: 'MCB 201', title: 'General Microbiology', level: 200, credits: 3 },
    { code: 'MCB 301', title: 'Microbial Genetics', level: 300, credits: 3 },
    { code: 'MCB 401', title: 'Immunology', level: 400, credits: 3 },
    { code: 'MCB 501', title: 'Industrial Microbiology', level: 500, credits: 3 },
  ],
  'Biochemistry': [
    { code: 'BCH 101', title: 'Intro to Biochemistry', level: 100, credits: 3 },
    { code: 'BCH 201', title: 'Chemistry of Biomolecules', level: 200, credits: 3 },
    { code: 'BCH 301', title: 'Enzymology', level: 300, credits: 3 },
    { code: 'BCH 401', title: 'Metabolism of Carbohydrates', level: 400, credits: 3 },
    { code: 'BCH 501', title: 'Nutritional Biochemistry', level: 500, credits: 3 },
  ],
  'Business Administration': [
    { code: 'BUS 101', title: 'Intro to Business', level: 100, credits: 3 },
    { code: 'BUS 201', title: 'Principles of Management', level: 200, credits: 3 },
    { code: 'BUS 301', title: 'Human Resource Management', level: 300, credits: 3 },
    { code: 'BUS 401', title: 'Strategic Management', level: 400, credits: 3 },
    { code: 'BUS 501', title: 'Corporate Governance', level: 500, credits: 3 },
  ],
}

// Helper to get random courses for a specific department and level
export function getCoursesForDepartment(departmentName, targetLevel = 300) {
  const deptCourses = allCourses[departmentName] || allCourses['Computer Science'];
  
  // Return the specific level course, plus some general courses
  const majorCourse = deptCourses.find(c => c.level === targetLevel) || deptCourses[0];
  
  return [
    { ...majorCourse, lecturer: 'Dr. Faculty', schedule: 'Mon 08:00', venue: 'MLT 1' },
    { code: 'GNS 301', title: 'Entrepreneurship Studies', lecturer: 'Dr. Musa', credits: 2, schedule: 'Tue 13:00', venue: 'CH 1' },
    { code: 'GNS 302', title: 'Peace & Conflict Studies', lecturer: 'Dr. Okonkwo', credits: 2, schedule: 'Thu 14:00', venue: 'CH 3' },
  ]
}
