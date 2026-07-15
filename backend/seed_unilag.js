import { query } from './lib/db.js'
import { randomUUID } from 'crypto'

const faculties = [
  { name: 'Faculty of Architecture', code: 'ARCH' },
  { name: 'Faculty of Arts', code: 'ARTS' },
  { name: 'Faculty of Basic Clinical Sciences', code: 'BCS' },
  { name: 'Faculty of Basic Medical Sciences', code: 'BMS' },
  { name: 'Faculty of Clinical Sciences', code: 'CLIN' },
  { name: 'Faculty of Communication and Media Studies', code: 'CMS' },
  { name: 'Faculty of Computing and Informatics', code: 'COMP' },
  { name: 'Faculty of Creative Arts', code: 'CRA' },
  { name: 'Faculty of Dental Sciences', code: 'DENT' },
  { name: 'Faculty of Education', code: 'EDU' },
  { name: 'Faculty of Engineering', code: 'ENG' },
  { name: 'Faculty of Environmental Sciences', code: 'ENV' },
  { name: 'Faculty of Health Professions', code: 'HLT' },
  { name: 'Faculty of Law', code: 'LAW' },
  { name: 'Faculty of Life Sciences', code: 'LIFE' },
  { name: 'Faculty of Management Sciences', code: 'MGT' },
  { name: 'Faculty of Pharmacy', code: 'PHARM' },
  { name: 'Faculty of Physical and Earth Sciences', code: 'PES' },
  { name: 'Faculty of Social Sciences', code: 'SOC' },
]

const departments = [
  // ARCH
  { name: 'Architecture', code: 'ARC', faculty: 'ARCH' },
  { name: 'Landscape Architecture and Urban Design', code: 'LAR', faculty: 'ARCH' },
  { name: 'Interior Architecture and Design', code: 'IAD', faculty: 'ARCH' },
  // ARTS
  { name: 'English Language', code: 'ENG', faculty: 'ARTS' },
  { name: 'French', code: 'FRE', faculty: 'ARTS' },
  { name: 'Russian', code: 'RUS', faculty: 'ARTS' },
  { name: 'Chinese Studies', code: 'CHI', faculty: 'ARTS' },
  { name: 'History and Strategic Studies', code: 'HSS', faculty: 'ARTS' },
  { name: 'Linguistics, African and Asian Studies', code: 'LGA', faculty: 'ARTS' },
  { name: 'Philosophy', code: 'PHL', faculty: 'ARTS' },
  { name: 'Christian Religious Studies', code: 'CRS', faculty: 'ARTS' },
  { name: 'Islamic Religious Studies', code: 'IRS', faculty: 'ARTS' },
  { name: 'Creative Arts', code: 'CRA', faculty: 'ARTS' },
  // BCS
  { name: 'Anatomic and Molecular Pathology', code: 'AMP', faculty: 'BCS' },
  { name: 'Haematology and Blood Transfusion', code: 'HBT', faculty: 'BCS' },
  { name: 'Medical Microbiology and Parasitology', code: 'MMB', faculty: 'BCS' },
  { name: 'Clinical Pathology', code: 'CLP', faculty: 'BCS' },
  { name: 'Clinical Pharmacology', code: 'CLPH', faculty: 'BCS' },
  // BMS
  { name: 'Anatomy', code: 'ANA', faculty: 'BMS' },
  { name: 'Physiology', code: 'PHYS', faculty: 'BMS' },
  { name: 'Medical Biochemistry', code: 'MBC', faculty: 'BMS' },
  { name: 'Pharmacology, Therapeutics and Toxicology', code: 'PTT', faculty: 'BMS' },
  // CLIN
  { name: 'Anaesthesia', code: 'ANS', faculty: 'CLIN' },
  { name: 'Community Health and Primary Care', code: 'CHC', faculty: 'CLIN' },
  { name: 'Medicine', code: 'MED', faculty: 'CLIN' },
  { name: 'Obstetrics and Gynaecology', code: 'OBG', faculty: 'CLIN' },
  { name: 'Ophthalmology', code: 'OPH', faculty: 'CLIN' },
  { name: 'Paediatrics', code: 'PAE', faculty: 'CLIN' },
  { name: 'Psychiatry', code: 'PSY', faculty: 'CLIN' },
  { name: 'Radiation Biology, Radiotherapy and Radiodiagnosis', code: 'RBR', faculty: 'CLIN' },
  { name: 'Surgery', code: 'SUR', faculty: 'CLIN' },
  // CMS
  { name: 'Mass Communication', code: 'MSC', faculty: 'CMS' },
  { name: 'Public Relations and Advertising', code: 'PRA', faculty: 'CMS' },
  { name: 'Journalism, Broadcasting and Media Studies', code: 'JBM', faculty: 'CMS' },
  // COMP
  { name: 'Computer Science', code: 'CSC', faculty: 'COMP' },
  { name: 'Intelligent Systems and Robotics', code: 'ISR', faculty: 'COMP' },
  { name: 'Cybersecurity and Software Engineering', code: 'CSE', faculty: 'COMP' },
  // CRA
  { name: 'Music and Sound Production', code: 'MSP', faculty: 'CRA' },
  { name: 'Theatre Arts and Film Studies', code: 'TAF', faculty: 'CRA' },
  { name: 'Fine and Applied Arts', code: 'FAA', faculty: 'CRA' },
  // DENT
  { name: 'Child Dental Health', code: 'CDH', faculty: 'DENT' },
  { name: 'Oral and Maxillofacial Pathology/Biology', code: 'OMP', faculty: 'DENT' },
  { name: 'Oral and Maxillofacial Surgery', code: 'OMS', faculty: 'DENT' },
  { name: 'Preventive Dentistry', code: 'PRD', faculty: 'DENT' },
  { name: 'Restorative Dentistry', code: 'RSD', faculty: 'DENT' },
  // EDU
  { name: 'Adult Education', code: 'ADE', faculty: 'EDU' },
  { name: 'Arts Education', code: 'AED', faculty: 'EDU' },
  { name: 'Educational Foundations', code: 'EDF', faculty: 'EDU' },
  { name: 'Educational Management', code: 'EDM', faculty: 'EDU' },
  { name: 'Human Kinetics and Health Education', code: 'HKE', faculty: 'EDU' },
  { name: 'Science Education', code: 'SCI', faculty: 'EDU' },
  { name: 'Social Sciences Education', code: 'SSE', faculty: 'EDU' },
  { name: 'Technology and Vocational Education', code: 'TVD', faculty: 'EDU' },
  { name: 'Early Childhood Education', code: 'ECE', faculty: 'EDU' },
  // ENG
  { name: 'Biomedical Engineering', code: 'BME', faculty: 'ENG' },
  { name: 'Chemical Engineering', code: 'CHE', faculty: 'ENG' },
  { name: 'Petroleum and Gas Engineering', code: 'PGE', faculty: 'ENG' },
  { name: 'Civil and Environmental Engineering', code: 'CVE', faculty: 'ENG' },
  { name: 'Electrical and Electronics Engineering', code: 'EEE', faculty: 'ENG' },
  { name: 'Mechanical Engineering', code: 'MEE', faculty: 'ENG' },
  { name: 'Metallurgical and Materials Engineering', code: 'MME', faculty: 'ENG' },
  { name: 'Surveying and Geoinformatics', code: 'SGE', faculty: 'ENG' },
  { name: 'Systems Engineering', code: 'SYE', faculty: 'ENG' },
  // ENV
  { name: 'Building', code: 'BLD', faculty: 'ENV' },
  { name: 'Estate Management', code: 'ESM', faculty: 'ENV' },
  { name: 'Quantity Surveying', code: 'QSY', faculty: 'ENV' },
  { name: 'Urban and Regional Planning', code: 'URP', faculty: 'ENV' },
  // HLT
  { name: 'Medical Laboratory Science', code: 'MLS', faculty: 'HLT' },
  { name: 'Nursing Science', code: 'NSC', faculty: 'HLT' },
  { name: 'Physiotherapy', code: 'PHY', faculty: 'HLT' },
  { name: 'Radiography', code: 'RAD', faculty: 'HLT' },
  // LAW
  { name: 'Law', code: 'LAW', faculty: 'LAW' },
  // LIFE
  { name: 'Biochemistry', code: 'BCH', faculty: 'LIFE' },
  { name: 'Botany', code: 'BOT', faculty: 'LIFE' },
  { name: 'Cell Biology and Genetics', code: 'CBG', faculty: 'LIFE' },
  { name: 'Marine Science', code: 'MAS', faculty: 'LIFE' },
  { name: 'Microbiology', code: 'MCB', faculty: 'LIFE' },
  { name: 'Zoology', code: 'ZOO', faculty: 'LIFE' },
  { name: 'Fisheries and Aquaculture', code: 'FQA', faculty: 'LIFE' },
  // MGT
  { name: 'Accounting', code: 'ACC', faculty: 'MGT' },
  { name: 'Actuarial Science and Insurance', code: 'AIS', faculty: 'MGT' },
  { name: 'Business Administration', code: 'BSA', faculty: 'MGT' },
  { name: 'Employment Relations and Human Resource Management', code: 'ERH', faculty: 'MGT' },
  { name: 'Finance', code: 'FIN', faculty: 'MGT' },
  // PHARM
  { name: 'Clinical Pharmacy and Biopharmacy', code: 'CPB', faculty: 'PHARM' },
  { name: 'Pharmaceutical Chemistry', code: 'PHC', faculty: 'PHARM' },
  { name: 'Pharmaceutical Microbiology and Biotechnology', code: 'PMB', faculty: 'PHARM' },
  { name: 'Pharmaceutics and Pharmaceutical Technology', code: 'PPT', faculty: 'PHARM' },
  { name: 'Pharmacognosy', code: 'PGN', faculty: 'PHARM' },
  // PES
  { name: 'Chemistry', code: 'CHM', faculty: 'PES' },
  { name: 'Geosciences', code: 'GEO', faculty: 'PES' },
  { name: 'Mathematics', code: 'MTH', faculty: 'PES' },
  { name: 'Physics', code: 'PHYS_P', faculty: 'PES' },
  { name: 'Statistics', code: 'STA', faculty: 'PES' },
  // SOC
  { name: 'Economics', code: 'ECO', faculty: 'SOC' },
  { name: 'Geography', code: 'GEO_S', faculty: 'SOC' },
  { name: 'Library and Information Science', code: 'LIS', faculty: 'SOC' },
  { name: 'Political Science', code: 'POL', faculty: 'SOC' },
  { name: 'Psychology', code: 'PSY_S', faculty: 'SOC' },
  { name: 'Social Work', code: 'SOW', faculty: 'SOC' },
  { name: 'Sociology', code: 'SOC', faculty: 'SOC' },
]

// Course catalog: dept code → courses per level
const courseCatalog = {
  // COMP - Computer Science
  CSC: {
    100: [
      { code: 'CSC 101', title: 'Introduction to Computer Science', units: 3 },
      { code: 'CSC 102', title: 'Computer Appreciation and Introduction to Programming', units: 2 },
      { code: 'MTH 101', title: 'Elementary Mathematics I', units: 3 },
      { code: 'MTH 102', title: 'Elementary Mathematics II', units: 3 },
      { code: 'PHY 101', title: 'General Physics I', units: 3 },
    ],
    200: [
      { code: 'CSC 201', title: 'Introduction to Programming (C)', units: 3 },
      { code: 'CSC 202', title: 'Computer Programming II (C++)', units: 3 },
      { code: 'CSC 203', title: 'Discrete Mathematics', units: 3 },
      { code: 'MTH 201', title: 'Mathematical Methods I', units: 3 },
      { code: 'PHY 201', title: 'General Physics II', units: 3 },
    ],
    300: [
      { code: 'CSC 301', title: 'Data Structures and Algorithms', units: 3 },
      { code: 'CSC 302', title: 'Operating Systems', units: 3 },
      { code: 'CSC 303', title: 'Software Engineering', units: 3 },
      { code: 'CSC 304', title: 'Database Management Systems', units: 3 },
      { code: 'CSC 305', title: 'Computer Architecture and Organization', units: 3 },
      { code: 'CSC 306', title: 'Theory of Computation', units: 3 },
    ],
    400: [
      { code: 'CSC 401', title: 'Artificial Intelligence', units: 3 },
      { code: 'CSC 402', title: 'Computer Networks', units: 3 },
      { code: 'CSC 403', title: 'Compiler Construction', units: 3 },
      { code: 'CSC 404', title: 'Computer Graphics', units: 3 },
      { code: 'CSC 405', title: 'Capstone Project', units: 6 },
    ],
  },
  // CSE - Cybersecurity and Software Engineering
  CSE: {
    100: [
      { code: 'CSE 101', title: 'Introduction to Cybersecurity', units: 2 },
      { code: 'CSC 101', title: 'Introduction to Computer Science', units: 3 },
      { code: 'MTH 101', title: 'Elementary Mathematics I', units: 3 },
    ],
    200: [
      { code: 'CSE 201', title: 'Cybersecurity Fundamentals', units: 3 },
      { code: 'CSE 202', title: 'Secure Programming', units: 3 },
      { code: 'CSC 201', title: 'Introduction to Programming', units: 3 },
    ],
    300: [
      { code: 'CSE 301', title: 'Network Security', units: 3 },
      { code: 'CSE 302', title: 'Cryptography and Data Protection', units: 3 },
      { code: 'CSE 303', title: 'Ethical Hacking and Penetration Testing', units: 3 },
      { code: 'CSE 304', title: 'Digital Forensics', units: 3 },
      { code: 'CSE 305', title: 'Secure Software Design', units: 3 },
    ],
    400: [
      { code: 'CSE 401', title: 'Advanced Persistent Threats', units: 3 },
      { code: 'CSE 402', title: 'Cybersecurity Management', units: 3 },
      { code: 'CSE 403', title: 'Capstone Project', units: 6 },
    ],
  },
  // ISR - Intelligent Systems and Robotics
  ISR: {
    100: [
      { code: 'ISR 101', title: 'Introduction to Robotics', units: 2 },
      { code: 'CSC 101', title: 'Introduction to Computer Science', units: 3 },
      { code: 'MTH 101', title: 'Elementary Mathematics I', units: 3 },
    ],
    200: [
      { code: 'ISR 201', title: 'Fundamentals of AI and Machine Learning', units: 3 },
      { code: 'ISR 202', title: 'Introduction to Embedded Systems', units: 3 },
    ],
    300: [
      { code: 'ISR 301', title: 'Robotics and Autonomous Systems', units: 3 },
      { code: 'ISR 302', title: 'Deep Learning and Neural Networks', units: 3 },
      { code: 'ISR 303', title: 'Computer Vision', units: 3 },
      { code: 'ISR 304', title: 'Natural Language Processing', units: 3 },
    ],
    400: [
      { code: 'ISR 401', title: 'Advanced Robotics', units: 3 },
      { code: 'ISR 402', title: 'Capstone Project', units: 6 },
    ],
  },
  // ENG - Engineering departments
  EEE: {
    100: [
      { code: 'EEE 101', title: 'Introduction to Electrical Engineering', units: 2 },
      { code: 'PHY 101', title: 'General Physics I', units: 3 },
      { code: 'MTH 101', title: 'Elementary Mathematics I', units: 3 },
    ],
    200: [
      { code: 'EEE 201', title: 'Circuit Theory I', units: 3 },
      { code: 'EEE 202', title: 'Electrical Measurements', units: 3 },
      { code: 'EEE 203', title: 'Electronic Devices I', units: 3 },
    ],
    300: [
      { code: 'EEE 301', title: 'Electromagnetic Theory', units: 3 },
      { code: 'EEE 302', title: 'Control Systems', units: 3 },
      { code: 'EEE 303', title: 'Power Systems I', units: 3 },
      { code: 'EEE 304', title: 'Signals and Systems', units: 3 },
    ],
    400: [
      { code: 'EEE 401', title: 'Power Systems II', units: 3 },
      { code: 'EEE 402', title: 'Microprocessor Systems', units: 3 },
      { code: 'EEE 403', title: 'Final Year Project', units: 6 },
    ],
  },
  MEE: {
    100: [
      { code: 'MEE 101', title: 'Introduction to Mechanical Engineering', units: 2 },
      { code: 'PHY 101', title: 'General Physics I', units: 3 },
      { code: 'MTH 101', title: 'Elementary Mathematics I', units: 3 },
    ],
    200: [
      { code: 'MEE 201', title: 'Engineering Mechanics I', units: 3 },
      { code: 'MEE 202', title: 'Thermodynamics I', units: 3 },
      { code: 'MEE 203', title: 'Strength of Materials', units: 3 },
    ],
    300: [
      { code: 'MEE 301', title: 'Fluid Mechanics', units: 3 },
      { code: 'MEE 302', title: 'Thermodynamics II', units: 3 },
      { code: 'MEE 303', title: 'Machine Design I', units: 3 },
      { code: 'MEE 304', title: 'Manufacturing Processes', units: 3 },
    ],
    400: [
      { code: 'MEE 401', title: 'Refrigeration and Air Conditioning', units: 3 },
      { code: 'MEE 402', title: 'Automobile Engineering', units: 3 },
      { code: 'MEE 403', title: 'Final Year Project', units: 6 },
    ],
  },
  CVE: {
    100: [
      { code: 'CVE 101', title: 'Introduction to Civil Engineering', units: 2 },
      { code: 'PHY 101', title: 'General Physics I', units: 3 },
      { code: 'MTH 101', title: 'Elementary Mathematics I', units: 3 },
    ],
    200: [
      { code: 'CVE 201', title: 'Engineering Mechanics I', units: 3 },
      { code: 'CVE 202', title: 'Strength of Materials', units: 3 },
      { code: 'CVE 203', title: 'Surveying I', units: 3 },
    ],
    300: [
      { code: 'CVE 301', title: 'Structural Analysis I', units: 3 },
      { code: 'CVE 302', title: 'Geotechnical Engineering I', units: 3 },
      { code: 'CVE 303', title: 'Fluid Mechanics', units: 3 },
      { code: 'CVE 304', title: 'Construction Materials', units: 3 },
    ],
    400: [
      { code: 'CVE 401', title: 'Structural Design', units: 3 },
      { code: 'CVE 402', title: 'Transportation Engineering', units: 3 },
      { code: 'CVE 403', title: 'Final Year Project', units: 6 },
    ],
  },
  CHE: {
    100: [
      { code: 'CHE 101', title: 'Introduction to Chemical Engineering', units: 2 },
      { code: 'CHM 101', title: 'General Chemistry I', units: 3 },
      { code: 'MTH 101', title: 'Elementary Mathematics I', units: 3 },
    ],
    200: [
      { code: 'CHE 201', title: 'Material and Energy Balance', units: 3 },
      { code: 'CHE 202', title: 'Fluid Mechanics', units: 3 },
      { code: 'CHE 203', title: 'Chemical Engineering Thermodynamics', units: 3 },
    ],
    300: [
      { code: 'CHE 301', title: 'Heat Transfer', units: 3 },
      { code: 'CHE 302', title: 'Mass Transfer', units: 3 },
      { code: 'CHE 303', title: 'Chemical Reaction Engineering', units: 3 },
    ],
    400: [
      { code: 'CHE 401', title: 'Process Design and Economics', units: 3 },
      { code: 'CHE 402', title: 'Final Year Project', units: 6 },
    ],
  },
  // LAW
  LAW: {
    100: [
      { code: 'LAW 101', title: 'Introduction to Nigerian Legal System', units: 3 },
      { code: 'LAW 102', title: 'Legal Methods', units: 3 },
    ],
    200: [
      { code: 'LAW 201', title: 'Constitutional Law', units: 3 },
      { code: 'LAW 202', title: 'Contract Law', units: 3 },
      { code: 'LAW 203', title: 'Law of Tort', units: 3 },
      { code: 'LAW 204', title: 'Criminal Law', units: 3 },
    ],
    300: [
      { code: 'LAW 301', title: 'Law of Property', units: 3 },
      { code: 'LAW 302', title: 'Commercial Law', units: 3 },
      { code: 'LAW 303', title: 'Equity and Trusts', units: 3 },
      { code: 'LAW 304', title: 'Evidence', units: 3 },
    ],
    400: [
      { code: 'LAW 401', title: 'Jurisprudence', units: 3 },
      { code: 'LAW 402', title: 'International Law', units: 3 },
      { code: 'LAW 403', title: 'Legal Practice and Ethics', units: 3 },
      { code: 'LAW 404', title: 'Research Project', units: 6 },
    ],
  },
  // MGT - Management Sciences
  ACC: {
    100: [
      { code: 'ACC 101', title: 'Principles of Accounting I', units: 3 },
      { code: 'ECO 101', title: 'Principles of Economics I', units: 3 },
      { code: 'BUS 101', title: 'Introduction to Business Studies', units: 2 },
    ],
    200: [
      { code: 'ACC 201', title: 'Financial Accounting I', units: 3 },
      { code: 'ACC 202', title: 'Cost Accounting I', units: 3 },
      { code: 'ACC 203', title: 'Business Law', units: 3 },
    ],
    300: [
      { code: 'ACC 301', title: 'Auditing and Investigation', units: 3 },
      { code: 'ACC 302', title: 'Management Accounting', units: 3 },
      { code: 'ACC 303', title: 'Taxation I', units: 3 },
      { code: 'ACC 304', title: 'Company Law', units: 3 },
    ],
    400: [
      { code: 'ACC 401', title: 'Public Sector Accounting', units: 3 },
      { code: 'ACC 402', title: 'Forensic Accounting', units: 3 },
      { code: 'ACC 403', title: 'Research Project', units: 6 },
    ],
  },
  BSA: {
    100: [
      { code: 'BSA 101', title: 'Introduction to Business Administration', units: 3 },
      { code: 'ECO 101', title: 'Principles of Economics I', units: 3 },
    ],
    200: [
      { code: 'BSA 201', title: 'Principles of Management', units: 3 },
      { code: 'BSA 202', title: 'Business Communication', units: 3 },
      { code: 'BSA 203', title: 'Marketing Principles', units: 3 },
    ],
    300: [
      { code: 'BSA 301', title: 'Organisational Behaviour', units: 3 },
      { code: 'BSA 302', title: 'Strategic Management', units: 3 },
      { code: 'BSA 303', title: 'Production and Operations Management', units: 3 },
    ],
    400: [
      { code: 'BSA 401', title: 'Entrepreneurship Development', units: 3 },
      { code: 'BSA 402', title: 'International Business', units: 3 },
      { code: 'BSA 403', title: 'Research Project', units: 6 },
    ],
  },
  ECO: {
    100: [
      { code: 'ECO 101', title: 'Principles of Economics I', units: 3 },
      { code: 'ECO 102', title: 'Principles of Economics II', units: 3 },
      { code: 'MTH 101', title: 'Elementary Mathematics I', units: 3 },
    ],
    200: [
      { code: 'ECO 201', title: 'Microeconomic Theory I', units: 3 },
      { code: 'ECO 202', title: 'Macroeconomic Theory I', units: 3 },
      { code: 'ECO 203', title: 'Mathematical Economics', units: 3 },
    ],
    300: [
      { code: 'ECO 301', title: 'Public Finance', units: 3 },
      { code: 'ECO 302', title: 'International Economics', units: 3 },
      { code: 'ECO 303', title: 'Development Economics', units: 3 },
      { code: 'ECO 304', title: 'Econometrics I', units: 3 },
    ],
    400: [
      { code: 'ECO 401', title: 'Monetary Theory and Policy', units: 3 },
      { code: 'ECO 402', title: 'Econometrics II', units: 3 },
      { code: 'ECO 403', title: 'Research Project', units: 6 },
    ],
  },
  // SOC - Social Sciences
  POL: {
    100: [
      { code: 'POL 101', title: 'Introduction to Political Science', units: 3 },
    ],
    200: [
      { code: 'POL 201', title: 'Nigerian Government and Politics', units: 3 },
      { code: 'POL 202', title: 'Comparative Government', units: 3 },
    ],
    300: [
      { code: 'POL 301', title: 'International Relations', units: 3 },
      { code: 'POL 302', title: 'Political Theory', units: 3 },
      { code: 'POL 303', title: 'Public Administration', units: 3 },
    ],
    400: [
      { code: 'POL 401', title: 'Research Methods in Political Science', units: 3 },
      { code: 'POL 402', title: 'Research Project', units: 6 },
    ],
  },
  PSY_S: {
    100: [
      { code: 'PSY 101', title: 'Introduction to Psychology', units: 3 },
    ],
    200: [
      { code: 'PSY 201', title: 'General Psychology', units: 3 },
      { code: 'PSY 202', title: 'Biological Psychology', units: 3 },
    ],
    300: [
      { code: 'PSY 301', title: 'Social Psychology', units: 3 },
      { code: 'PSY 302', title: 'Developmental Psychology', units: 3 },
      { code: 'PSY 303', title: 'Abnormal Psychology', units: 3 },
    ],
    400: [
      { code: 'PSY 401', title: 'Industrial and Organisational Psychology', units: 3 },
      { code: 'PSY 402', title: 'Research Project', units: 6 },
    ],
  },
  // LIFE - Life Sciences
  BCH: {
    100: [
      { code: 'BCH 101', title: 'Introduction to Biochemistry', units: 3 },
      { code: 'CHM 101', title: 'General Chemistry I', units: 3 },
    ],
    200: [
      { code: 'BCH 201', title: 'Organic Chemistry I', units: 3 },
      { code: 'BCH 202', title: 'Cell Biology', units: 3 },
      { code: 'BCH 203', title: 'General Biochemistry I', units: 3 },
    ],
    300: [
      { code: 'BCH 301', title: 'Metabolism I', units: 3 },
      { code: 'BCH 302', title: 'Enzymology', units: 3 },
      { code: 'BCH 303', title: 'Molecular Biology', units: 3 },
      { code: 'BCH 304', title: 'Biochemical Techniques', units: 3 },
    ],
    400: [
      { code: 'BCH 401', title: 'Metabolism II', units: 3 },
      { code: 'BCH 402', title: 'Bioinformatics', units: 3 },
      { code: 'BCH 403', title: 'Research Project', units: 6 },
    ],
  },
  MCB: {
    100: [
      { code: 'MCB 101', title: 'Introduction to Microbiology', units: 3 },
      { code: 'BCH 101', title: 'Introduction to Biochemistry', units: 3 },
    ],
    200: [
      { code: 'MCB 201', title: 'General Microbiology I', units: 3 },
      { code: 'MCB 202', title: 'Microbial Physiology', units: 3 },
    ],
    300: [
      { code: 'MCB 301', title: 'Immunology', units: 3 },
      { code: 'MCB 302', title: 'Medical Microbiology', units: 3 },
      { code: 'MCB 303', title: 'Industrial Microbiology', units: 3 },
    ],
    400: [
      { code: 'MCB 401', title: 'Environmental Microbiology', units: 3 },
      { code: 'MCB 402', title: 'Research Project', units: 6 },
    ],
  },
  // PES - Physical and Earth Sciences
  MTH: {
    100: [
      { code: 'MTH 101', title: 'Elementary Mathematics I', units: 3 },
      { code: 'MTH 102', title: 'Elementary Mathematics II', units: 3 },
    ],
    200: [
      { code: 'MTH 201', title: 'Mathematical Methods I', units: 3 },
      { code: 'MTH 202', title: 'Linear Algebra I', units: 3 },
      { code: 'MTH 203', title: 'Elementary Differential Equations I', units: 3 },
    ],
    300: [
      { code: 'MTH 301', title: 'Real Analysis I', units: 3 },
      { code: 'MTH 302', title: 'Abstract Algebra I', units: 3 },
      { code: 'MTH 303', title: 'Numerical Analysis I', units: 3 },
      { code: 'MTH 304', title: 'Probability I', units: 3 },
    ],
    400: [
      { code: 'MTH 401', title: 'Functional Analysis', units: 3 },
      { code: 'MTH 402', title: 'Mathematical Modelling', units: 3 },
      { code: 'MTH 403', title: 'Research Project', units: 6 },
    ],
  },
  CHM: {
    100: [
      { code: 'CHM 101', title: 'General Chemistry I', units: 3 },
      { code: 'CHM 102', title: 'General Chemistry II', units: 3 },
    ],
    200: [
      { code: 'CHM 201', title: 'Inorganic Chemistry I', units: 3 },
      { code: 'CHM 202', title: 'Physical Chemistry I', units: 3 },
      { code: 'CHM 203', title: 'Organic Chemistry I', units: 3 },
    ],
    300: [
      { code: 'CHM 301', title: 'Inorganic Chemistry II', units: 3 },
      { code: 'CHM 302', title: 'Physical Chemistry II', units: 3 },
      { code: 'CHM 303', title: 'Organic Chemistry II', units: 3 },
    ],
    400: [
      { code: 'CHM 401', title: 'Analytical Chemistry', units: 3 },
      { code: 'CHM 402', title: 'Research Project', units: 6 },
    ],
  },
  // ARTS - English Language
  ENG: {
    100: [
      { code: 'ENG 101', title: 'Communication in English I', units: 3 },
      { code: 'ENG 102', title: 'Communication in English II', units: 3 },
    ],
    200: [
      { code: 'ENG 201', title: 'Introduction to Literature in English', units: 3 },
      { code: 'ENG 202', title: 'English Syntax', units: 3 },
      { code: 'ENG 203', title: 'African Literature in English', units: 3 },
    ],
    300: [
      { code: 'ENG 301', title: 'English Phonology', units: 3 },
      { code: 'ENG 302', title: 'Semantics', units: 3 },
      { code: 'ENG 303', title: 'Literary Criticism and Theory', units: 3 },
      { code: 'ENG 304', title: 'Nigerian Literature', units: 3 },
    ],
    400: [
      { code: 'ENG 401', title: 'Sociolinguistics', units: 3 },
      { code: 'ENG 402', title: 'Research Project', units: 6 },
    ],
  },
  // EDU - Science Education
  SCI: {
    100: [
      { code: 'SCI 101', title: 'Foundations of Science Education', units: 3 },
    ],
    200: [
      { code: 'SCI 201', title: 'Educational Psychology', units: 3 },
      { code: 'SCI 202', title: 'Introduction to Science Teaching', units: 3 },
    ],
    300: [
      { code: 'SCI 301', title: 'Curriculum Development in Science', units: 3 },
      { code: 'SCI 302', title: 'Science Laboratory Techniques', units: 3 },
    ],
    400: [
      { code: 'SCI 401', title: 'Science Education Research', units: 3 },
      { code: 'SCI 402', title: 'Teaching Practice', units: 6 },
      { code: 'SCI 403', title: 'Research Project', units: 6 },
    ],
  },
  // HLT - Health Professions
  NSC: {
    100: [
      { code: 'NSC 101', title: 'Introduction to Nursing Science', units: 3 },
      { code: 'ANA 101', title: 'Human Anatomy', units: 3 },
    ],
    200: [
      { code: 'NSC 201', title: 'Fundamentals of Nursing I', units: 3 },
      { code: 'NSC 202', title: 'Medical Sociology', units: 3 },
    ],
    300: [
      { code: 'NSC 301', title: 'Medical-Surgical Nursing I', units: 3 },
      { code: 'NSC 302', title: 'Maternal and Child Health Nursing', units: 3 },
    ],
    400: [
      { code: 'NSC 401', title: 'Community Health Nursing', units: 3 },
      { code: 'NSC 402', title: 'Nursing Research and Ethics', units: 3 },
      { code: 'NSC 403', title: 'Clinical Placement', units: 6 },
    ],
  },
  // PHARM - Pharmacy
  PHC: {
    100: [
      { code: 'PHC 101', title: 'Introduction to Pharmaceutical Sciences', units: 3 },
      { code: 'CHM 101', title: 'General Chemistry I', units: 3 },
    ],
    200: [
      { code: 'PHC 201', title: 'Pharmaceutical Chemistry I', units: 3 },
      { code: 'PHC 202', title: 'Organic Chemistry for Pharmacy', units: 3 },
    ],
    300: [
      { code: 'PHC 301', title: 'Medicinal Chemistry I', units: 3 },
      { code: 'PHC 302', title: 'Pharmaceutical Analysis', units: 3 },
    ],
    400: [
      { code: 'PHC 401', title: 'Medicinal Chemistry II', units: 3 },
      { code: 'PHC 402', title: 'Research Project', units: 6 },
    ],
  },
  // Additional departments with basic course structures
  MSC: { 100: [{ code: 'MSC 101', title: 'Introduction to Mass Communication', units: 3 }], 200: [{ code: 'MSC 201', title: 'News Writing and Reporting', units: 3 }], 300: [{ code: 'MSC 301', title: 'Media Law and Ethics', units: 3 }], 400: [{ code: 'MSC 401', title: 'Research Project', units: 6 }] },
  ARC: { 100: [{ code: 'ARC 101', title: 'Introduction to Architecture', units: 3 }], 200: [{ code: 'ARC 201', title: 'Architectural Design I', units: 3 }], 300: [{ code: 'ARC 301', title: 'Architectural Design III', units: 3 }], 400: [{ code: 'ARC 401', title: 'Final Year Design Project', units: 6 }], 500: [{ code: 'ARC 501', title: 'Masters Research Project', units: 6 }] },
  HSS: { 100: [{ code: 'HSS 101', title: 'Introduction to History', units: 3 }], 200: [{ code: 'HSS 201', title: 'African History I', units: 3 }], 300: [{ code: 'HSS 301', title: 'Nigerian History', units: 3 }], 400: [{ code: 'HSS 401', title: 'Research Project', units: 6 }] },
  PHL: { 100: [{ code: 'PHL 101', title: 'Introduction to Philosophy', units: 3 }], 200: [{ code: 'PHL 201', title: 'Logic and Critical Thinking', units: 3 }], 300: [{ code: 'PHL 301', title: 'African Philosophy', units: 3 }], 400: [{ code: 'PHL 401', title: 'Research Project', units: 6 }] },
  GEO: { 100: [{ code: 'GEO 101', title: 'Introduction to Geosciences', units: 3 }], 200: [{ code: 'GEO 201', title: 'Mineralogy', units: 3 }], 300: [{ code: 'GEO 301', title: 'Structural Geology', units: 3 }], 400: [{ code: 'GEO 401', title: 'Research Project', units: 6 }] },
  STA: { 100: [{ code: 'STA 101', title: 'Introduction to Statistics', units: 3 }], 200: [{ code: 'STA 201', title: 'Statistical Inference I', units: 3 }], 300: [{ code: 'STA 301', title: 'Regression Analysis', units: 3 }], 400: [{ code: 'STA 401', title: 'Research Project', units: 6 }] },
  BOT: { 100: [{ code: 'BOT 101', title: 'Introduction to Botany', units: 3 }], 200: [{ code: 'BOT 201', title: 'Plant Anatomy', units: 3 }], 300: [{ code: 'BOT 301', title: 'Plant Physiology', units: 3 }], 400: [{ code: 'BOT 401', title: 'Research Project', units: 6 }] },
  ZOO: { 100: [{ code: 'ZOO 101', title: 'Introduction to Zoology', units: 3 }], 200: [{ code: 'ZOO 201', title: 'Invertebrate Zoology', units: 3 }], 300: [{ code: 'ZOO 301', title: 'Vertebrate Zoology', units: 3 }], 400: [{ code: 'ZOO 401', title: 'Research Project', units: 6 }] },
  LIS: { 100: [{ code: 'LIS 101', title: 'Introduction to Library Science', units: 3 }], 200: [{ code: 'LIS 201', title: 'Cataloguing and Classification', units: 3 }], 300: [{ code: 'LIS 301', title: 'Information Retrieval', units: 3 }], 400: [{ code: 'LIS 401', title: 'Research Project', units: 6 }] },
  SOC: { 100: [{ code: 'SOC 101', title: 'Introduction to Sociology', units: 3 }], 200: [{ code: 'SOC 201', title: 'Sociology of Nigeria', units: 3 }], 300: [{ code: 'SOC 301', title: 'Social Stratification', units: 3 }], 400: [{ code: 'SOC 401', title: 'Research Project', units: 6 }] },
  ESM: { 100: [{ code: 'ESM 101', title: 'Introduction to Estate Management', units: 3 }], 200: [{ code: 'ESM 201', title: 'Land Economics', units: 3 }], 300: [{ code: 'ESM 301', title: 'Valuation', units: 3 }], 400: [{ code: 'ESM 401', title: 'Research Project', units: 6 }] },
  BLD: { 100: [{ code: 'BLD 101', title: 'Introduction to Building Technology', units: 3 }], 200: [{ code: 'BLD 201', title: 'Building Materials', units: 3 }], 300: [{ code: 'BLD 301', title: 'Building Construction', units: 3 }], 400: [{ code: 'BLD 401', title: 'Research Project', units: 6 }] },
  FIN: { 100: [{ code: 'FIN 101', title: 'Introduction to Finance', units: 3 }], 200: [{ code: 'FIN 201', title: 'Financial Management', units: 3 }], 300: [{ code: 'FIN 301', title: 'Investment Analysis', units: 3 }], 400: [{ code: 'FIN 401', title: 'Research Project', units: 6 }] },
  AIS: { 100: [{ code: 'AIS 101', title: 'Introduction to Actuarial Science', units: 3 }], 200: [{ code: 'AIS 201', title: 'Probability and Statistics', units: 3 }], 300: [{ code: 'AIS 301', title: 'Risk Theory', units: 3 }], 400: [{ code: 'AIS 401', title: 'Research Project', units: 6 }] },
  ERH: { 100: [{ code: 'ERH 101', title: 'Introduction to Human Resource Management', units: 3 }], 200: [{ code: 'ERH 201', title: 'Labour Relations', units: 3 }], 300: [{ code: 'ERH 301', title: 'Compensation Management', units: 3 }], 400: [{ code: 'ERH 401', title: 'Research Project', units: 6 }] },
  FRE: { 100: [{ code: 'FRE 101', title: 'Introduction to French Language', units: 3 }], 200: [{ code: 'FRE 201', title: 'French Grammar and Composition', units: 3 }], 300: [{ code: 'FRE 301', title: 'French Literature', units: 3 }], 400: [{ code: 'FRE 401', title: 'Research Project', units: 6 }] },
  CHI: { 100: [{ code: 'CHI 101', title: 'Introduction to Chinese Studies', units: 3 }], 200: [{ code: 'CHI 201', title: 'Chinese Language I', units: 3 }], 300: [{ code: 'CHI 301', title: 'Chinese Culture and Society', units: 3 }], 400: [{ code: 'CHI 401', title: 'Research Project', units: 6 }] },
  SOW: { 100: [{ code: 'SOW 101', title: 'Introduction to Social Work', units: 3 }], 200: [{ code: 'SOW 201', title: 'Social Welfare Administration', units: 3 }], 300: [{ code: 'SOW 301', title: 'Community Development', units: 3 }], 400: [{ code: 'SOW 401', title: 'Research Project', units: 6 }] },
  GEO_S: { 100: [{ code: 'GEO 101', title: 'Introduction to Geography', units: 3 }], 200: [{ code: 'GEO 201', title: 'Cartography', units: 3 }], 300: [{ code: 'GEO 301', title: 'Environmental Management', units: 3 }], 400: [{ code: 'GEO 401', title: 'Research Project', units: 6 }] },
  MAS: { 100: [{ code: 'MAS 101', title: 'Introduction to Marine Science', units: 3 }], 200: [{ code: 'MAS 201', title: 'Marine Ecology', units: 3 }], 300: [{ code: 'MAS 301', title: 'Oceanography', units: 3 }], 400: [{ code: 'MAS 401', title: 'Research Project', units: 6 }] },
  FQA: { 100: [{ code: 'FQA 101', title: 'Introduction to Fisheries', units: 3 }], 200: [{ code: 'FQA 201', title: 'Aquatic Biology', units: 3 }], 300: [{ code: 'FQA 301', title: 'Aquaculture', units: 3 }], 400: [{ code: 'FQA 401', title: 'Research Project', units: 6 }] },
  CBG: { 100: [{ code: 'CBG 101', title: 'Introduction to Cell Biology', units: 3 }], 200: [{ code: 'CBG 201', title: 'Genetics I', units: 3 }], 300: [{ code: 'CBG 301', title: 'Molecular Genetics', units: 3 }], 400: [{ code: 'CBG 401', title: 'Research Project', units: 6 }] },
  PRA: { 100: [{ code: 'PRA 101', title: 'Introduction to Public Relations', units: 3 }], 200: [{ code: 'PRA 201', title: 'Advertising Principles', units: 3 }], 300: [{ code: 'PRA 301', title: 'Corporate Communication', units: 3 }], 400: [{ code: 'PRA 401', title: 'Research Project', units: 6 }] },
  JBM: { 100: [{ code: 'JBM 101', title: 'Introduction to Journalism', units: 3 }], 200: [{ code: 'JBM 201', title: 'Broadcasting Principles', units: 3 }], 300: [{ code: 'JBM 301', title: 'Digital Media', units: 3 }], 400: [{ code: 'JBM 401', title: 'Research Project', units: 6 }] },
  MSP: { 100: [{ code: 'MSP 101', title: 'Introduction to Music', units: 3 }], 200: [{ code: 'MSP 201', title: 'Music Theory I', units: 3 }], 300: [{ code: 'MSP 301', title: 'Sound Production', units: 3 }], 400: [{ code: 'MSP 401', title: 'Research Project', units: 6 }] },
  TAF: { 100: [{ code: 'TAF 101', title: 'Introduction to Theatre Arts', units: 3 }], 200: [{ code: 'TAF 201', title: 'Dramatic Theory', units: 3 }], 300: [{ code: 'TAF 301', title: 'Film Studies', units: 3 }], 400: [{ code: 'TAF 401', title: 'Research Project', units: 6 }] },
  FAA: { 100: [{ code: 'FAA 101', title: 'Introduction to Fine Arts', units: 3 }], 200: [{ code: 'FAA 201', title: 'Drawing and Painting', units: 3 }], 300: [{ code: 'FAA 301', title: 'Sculpture', units: 3 }], 400: [{ code: 'FAA 401', title: 'Research Project', units: 6 }] },
  // Medical departments
  ANA: { 100: [{ code: 'ANA 101', title: 'Human Anatomy I', units: 3 }], 200: [{ code: 'ANA 201', title: 'Human Anatomy II', units: 3 }], 300: [{ code: 'ANA 301', title: 'Gross Anatomy', units: 3 }], 400: [{ code: 'ANA 401', title: 'Research Project', units: 6 }] },
  PHYS: { 100: [{ code: 'PHYS 101', title: 'Human Physiology I', units: 3 }], 200: [{ code: 'PHYS 201', title: 'Human Physiology II', units: 3 }], 300: [{ code: 'PHYS 301', title: 'Systemic Physiology', units: 3 }], 400: [{ code: 'PHYS 401', title: 'Research Project', units: 6 }] },
  MED: { 100: [{ code: 'MED 101', title: 'Introduction to Clinical Medicine', units: 3 }], 200: [{ code: 'MED 201', title: 'Pathology I', units: 3 }], 300: [{ code: 'MED 301', title: 'Internal Medicine', units: 3 }], 400: [{ code: 'MED 401', title: 'Clinical Clerkship', units: 6 }] },
  SUR: { 100: [{ code: 'SUR 101', title: 'Introduction to Surgery', units: 3 }], 200: [{ code: 'SUR 201', title: 'General Surgery', units: 3 }], 300: [{ code: 'SUR 301', title: 'Surgical Specialties', units: 3 }], 400: [{ code: 'SUR 401', title: 'Surgical Clerkship', units: 6 }] },
  // Remaining depts with minimal structure
  BME: { 100: [{ code: 'BME 101', title: 'Introduction to Biomedical Engineering', units: 3 }], 200: [{ code: 'BME 201', title: 'Anatomy and Physiology for Engineers', units: 3 }], 300: [{ code: 'BME 301', title: 'Biomedical Instrumentation', units: 3 }], 400: [{ code: 'BME 401', title: 'Final Year Project', units: 6 }] },
  PGE: { 100: [{ code: 'PGE 101', title: 'Introduction to Petroleum Engineering', units: 3 }], 200: [{ code: 'PGE 201', title: 'Petroleum Geology', units: 3 }], 300: [{ code: 'PGE 301', title: 'Drilling Engineering', units: 3 }], 400: [{ code: 'PGE 401', title: 'Final Year Project', units: 6 }] },
  MME: { 100: [{ code: 'MME 101', title: 'Introduction to Materials Engineering', units: 3 }], 200: [{ code: 'MME 201', title: 'Materials Science', units: 3 }], 300: [{ code: 'MME 301', title: 'Phase Transformations', units: 3 }], 400: [{ code: 'MME 401', title: 'Final Year Project', units: 6 }] },
  SGE: { 100: [{ code: 'SGE 101', title: 'Introduction to Surveying', units: 3 }], 200: [{ code: 'SGE 201', title: 'Surveying I', units: 3 }], 300: [{ code: 'SGE 301', title: 'Geodesy', units: 3 }], 400: [{ code: 'SGE 401', title: 'Final Year Project', units: 6 }] },
  SYE: { 100: [{ code: 'SYE 101', title: 'Introduction to Systems Engineering', units: 3 }], 200: [{ code: 'SYE 201', title: 'Systems Analysis', units: 3 }], 300: [{ code: 'SYE 301', title: 'Control Systems', units: 3 }], 400: [{ code: 'SYE 401', title: 'Final Year Project', units: 6 }] },
  LAR: { 100: [{ code: 'LAR 101', title: 'Introduction to Landscape Architecture', units: 3 }], 200: [{ code: 'LAR 201', title: 'Landscape Design I', units: 3 }], 300: [{ code: 'LAR 301', title: 'Landscape Planning', units: 3 }], 400: [{ code: 'LAR 401', title: 'Final Year Project', units: 6 }] },
  IAD: { 100: [{ code: 'IAD 101', title: 'Introduction to Interior Design', units: 3 }], 200: [{ code: 'IAD 201', title: 'Interior Design I', units: 3 }], 300: [{ code: 'IAD 301', title: 'Interior Architecture', units: 3 }], 400: [{ code: 'IAD 401', title: 'Final Year Project', units: 6 }] },
  QSY: { 100: [{ code: 'QSY 101', title: 'Introduction to Quantity Surveying', units: 3 }], 200: [{ code: 'QSY 201', title: 'Building Measurement', units: 3 }], 300: [{ code: 'QSY 301', title: 'Construction Economics', units: 3 }], 400: [{ code: 'QSY 401', title: 'Final Year Project', units: 6 }] },
  URP: { 100: [{ code: 'URP 101', title: 'Introduction to Urban Planning', units: 3 }], 200: [{ code: 'URP 201', title: 'Urban Design', units: 3 }], 300: [{ code: 'URP 301', title: 'Regional Planning', units: 3 }], 400: [{ code: 'URP 401', title: 'Final Year Project', units: 6 }] },
  MLS: { 100: [{ code: 'MLS 101', title: 'Introduction to Medical Laboratory Science', units: 3 }], 200: [{ code: 'MLS 201', title: 'Haematology', units: 3 }], 300: [{ code: 'MLS 301', title: 'Clinical Chemistry', units: 3 }], 400: [{ code: 'MLS 401', title: 'Research Project', units: 6 }] },
  RAD: { 100: [{ code: 'RAD 101', title: 'Introduction to Radiography', units: 3 }], 200: [{ code: 'RAD 201', title: 'Radiographic Techniques', units: 3 }], 300: [{ code: 'RAD 301', title: 'Radiation Physics', units: 3 }], 400: [{ code: 'RAD 401', title: 'Research Project', units: 6 }] },
  PHY: { 100: [{ code: 'PHY 101', title: 'Introduction to Physiotherapy', units: 3 }], 200: [{ code: 'PHY 201', title: 'Musculoskeletal Physiotherapy', units: 3 }], 300: [{ code: 'PHY 301', title: 'Neurological Physiotherapy', units: 3 }], 400: [{ code: 'PHY 401', title: 'Research Project', units: 6 }] },
  CDH: { 100: [{ code: 'CDH 101', title: 'Introduction to Dental Sciences', units: 3 }], 200: [{ code: 'CDH 201', title: 'Paediatric Dentistry', units: 3 }], 300: [{ code: 'CDH 301', title: 'Child Dental Health', units: 3 }], 400: [{ code: 'CDH 401', title: 'Research Project', units: 6 }] },
  OMP: { 100: [{ code: 'OMP 101', title: 'Oral Biology I', units: 3 }], 200: [{ code: 'OMP 201', title: 'Oral Pathology', units: 3 }], 300: [{ code: 'OMP 301', title: 'Oral Medicine', units: 3 }], 400: [{ code: 'OMP 401', title: 'Research Project', units: 6 }] },
  OMS: { 100: [{ code: 'OMS 101', title: 'Introduction to Oral Surgery', units: 3 }], 200: [{ code: 'OMS 201', title: 'General Surgery for Dentistry', units: 3 }], 300: [{ code: 'OMS 301', title: 'Oral and Maxillofacial Surgery', units: 3 }], 400: [{ code: 'OMS 401', title: 'Research Project', units: 6 }] },
  PRD: { 100: [{ code: 'PRD 101', title: 'Introduction to Preventive Dentistry', units: 3 }], 200: [{ code: 'PRD 201', title: 'Community Oral Health', units: 3 }], 300: [{ code: 'PRD 301', title: 'Preventive Dentistry', units: 3 }], 400: [{ code: 'PRD 401', title: 'Research Project', units: 6 }] },
  RSD: { 100: [{ code: 'RSD 101', title: 'Introduction to Restorative Dentistry', units: 3 }], 200: [{ code: 'RSD 201', title: 'Dental Materials', units: 3 }], 300: [{ code: 'RSD 301', title: 'Restorative Dentistry', units: 3 }], 400: [{ code: 'RSD 401', title: 'Research Project', units: 6 }] },
  AMP: { 100: [{ code: 'AMP 101', title: 'Introduction to Pathology', units: 3 }], 200: [{ code: 'AMP 201', title: 'General Pathology', units: 3 }], 300: [{ code: 'AMP 301', title: 'Systemic Pathology', units: 3 }], 400: [{ code: 'AMP 401', title: 'Research Project', units: 6 }] },
  HBT: { 100: [{ code: 'HBT 101', title: 'Introduction to Haematology', units: 3 }], 200: [{ code: 'HBT 201', title: 'Blood Banking', units: 3 }], 300: [{ code: 'HBT 301', title: 'Haematological Techniques', units: 3 }], 400: [{ code: 'HBT 401', title: 'Research Project', units: 6 }] },
  MMB: { 100: [{ code: 'MMB 101', title: 'Introduction to Medical Microbiology', units: 3 }], 200: [{ code: 'MMB 201', title: 'Bacteriology', units: 3 }], 300: [{ code: 'MMB 301', title: 'Virology', units: 3 }], 400: [{ code: 'MMB 401', title: 'Research Project', units: 6 }] },
  CLP: { 100: [{ code: 'CLP 101', title: 'Introduction to Clinical Pathology', units: 3 }], 200: [{ code: 'CLP 201', title: 'Chemical Pathology', units: 3 }], 300: [{ code: 'CLP 301', title: 'Clinical Chemistry', units: 3 }], 400: [{ code: 'CLP 401', title: 'Research Project', units: 6 }] },
  CLPH: { 100: [{ code: 'CLPH 101', title: 'Introduction to Pharmacology', units: 3 }], 200: [{ code: 'CLPH 201', title: 'General Pharmacology', units: 3 }], 300: [{ code: 'CLPH 301', title: 'Clinical Pharmacology', units: 3 }], 400: [{ code: 'CLPH 401', title: 'Research Project', units: 6 }] },
  ANS: { 100: [{ code: 'ANS 101', title: 'Introduction to Anaesthesia', units: 3 }], 200: [{ code: 'ANS 201', title: 'Physics of Anaesthesia', units: 3 }], 300: [{ code: 'ANS 301', title: 'Clinical Anaesthesia', units: 3 }], 400: [{ code: 'ANS 401', title: 'Research Project', units: 6 }] },
  CHC: { 100: [{ code: 'CHC 101', title: 'Introduction to Community Health', units: 3 }], 200: [{ code: 'CHC 201', title: 'Epidemiology', units: 3 }], 300: [{ code: 'CHC 301', title: 'Primary Healthcare', units: 3 }], 400: [{ code: 'CHC 401', title: 'Research Project', units: 6 }] },
  OBG: { 100: [{ code: 'OBG 101', title: 'Introduction to Obstetrics', units: 3 }], 200: [{ code: 'OBG 201', title: 'Obstetrics', units: 3 }], 300: [{ code: 'OBG 301', title: 'Gynaecology', units: 3 }], 400: [{ code: 'OBG 401', title: 'Research Project', units: 6 }] },
  OPH: { 100: [{ code: 'OPH 101', title: 'Introduction to Ophthalmology', units: 3 }], 200: [{ code: 'OPH 201', title: 'Ocular Anatomy', units: 3 }], 300: [{ code: 'OPH 301', title: 'Clinical Ophthalmology', units: 3 }], 400: [{ code: 'OPH 401', title: 'Research Project', units: 6 }] },
  PAE: { 100: [{ code: 'PAE 101', title: 'Introduction to Paediatrics', units: 3 }], 200: [{ code: 'PAE 201', title: 'Child Health', units: 3 }], 300: [{ code: 'PAE 301', title: 'Paediatric Medicine', units: 3 }], 400: [{ code: 'PAE 401', title: 'Research Project', units: 6 }] },
  PSY: { 100: [{ code: 'PSY 101', title: 'Introduction to Psychiatry', units: 3 }], 200: [{ code: 'PSY 201', title: 'General Psychiatry', units: 3 }], 300: [{ code: 'PSY 301', title: 'Clinical Psychiatry', units: 3 }], 400: [{ code: 'PSY 401', title: 'Research Project', units: 6 }] },
  RBR: { 100: [{ code: 'RBR 101', title: 'Introduction to Radiology', units: 3 }], 200: [{ code: 'RBR 201', title: 'Radiation Biology', units: 3 }], 300: [{ code: 'RBR 301', title: 'Radiotherapy', units: 3 }], 400: [{ code: 'RBR 401', title: 'Research Project', units: 6 }] },
  ADE: { 100: [{ code: 'ADE 101', title: 'Introduction to Adult Education', units: 3 }], 200: [{ code: 'ADE 201', title: 'Adult Learning Theories', units: 3 }], 300: [{ code: 'ADE 301', title: 'Community Education', units: 3 }], 400: [{ code: 'ADE 401', title: 'Research Project', units: 6 }] },
  AED: { 100: [{ code: 'AED 101', title: 'Introduction to Arts Education', units: 3 }], 200: [{ code: 'AED 201', title: 'Curriculum Design', units: 3 }], 300: [{ code: 'AED 301', title: 'Teaching Methods', units: 3 }], 400: [{ code: 'AED 401', title: 'Research Project', units: 6 }] },
  EDF: { 100: [{ code: 'EDF 101', title: 'Foundations of Education', units: 3 }], 200: [{ code: 'EDF 201', title: 'Educational Psychology', units: 3 }], 300: [{ code: 'EDF 301', title: 'Guidance and Counselling', units: 3 }], 400: [{ code: 'EDF 401', title: 'Research Project', units: 6 }] },
  EDM: { 100: [{ code: 'EDM 101', title: 'Introduction to Educational Management', units: 3 }], 200: [{ code: 'EDM 201', title: 'Educational Planning', units: 3 }], 300: [{ code: 'EDM 301', title: 'School Administration', units: 3 }], 400: [{ code: 'EDM 401', title: 'Research Project', units: 6 }] },
  HKE: { 100: [{ code: 'HKE 101', title: 'Introduction to Human Kinetics', units: 3 }], 200: [{ code: 'HKE 201', title: 'Sports Science', units: 3 }], 300: [{ code: 'HKE 301', title: 'Health Education', units: 3 }], 400: [{ code: 'HKE 401', title: 'Research Project', units: 6 }] },
  SSE: { 100: [{ code: 'SSE 101', title: 'Introduction to Social Sciences Education', units: 3 }], 200: [{ code: 'SSE 201', title: 'Teaching Social Sciences', units: 3 }], 300: [{ code: 'SSE 301', title: 'Educational Research', units: 3 }], 400: [{ code: 'SSE 401', title: 'Research Project', units: 6 }] },
  TVD: { 100: [{ code: 'TVD 101', title: 'Introduction to Vocational Education', units: 3 }], 200: [{ code: 'TVD 201', title: 'Technical Education Methods', units: 3 }], 300: [{ code: 'TVD 301', title: 'Industrial Education', units: 3 }], 400: [{ code: 'TVD 401', title: 'Research Project', units: 6 }] },
  ECE: { 100: [{ code: 'ECE 101', title: 'Introduction to Early Childhood Education', units: 3 }], 200: [{ code: 'ECE 201', title: 'Child Development', units: 3 }], 300: [{ code: 'ECE 301', title: 'Early Childhood Curriculum', units: 3 }], 400: [{ code: 'ECE 401', title: 'Research Project', units: 6 }] },
  CPB: { 100: [{ code: 'CPB 101', title: 'Introduction to Clinical Pharmacy', units: 3 }], 200: [{ code: 'CPB 201', title: 'Pharmacotherapy', units: 3 }], 300: [{ code: 'CPB 301', title: 'Clinical Pharmacy Practice', units: 3 }], 400: [{ code: 'CPB 401', title: 'Research Project', units: 6 }] },
  PMB: { 100: [{ code: 'PMB 101', title: 'Introduction to Pharmaceutical Microbiology', units: 3 }], 200: [{ code: 'PMB 201', title: 'Microbial Genetics', units: 3 }], 300: [{ code: 'PMB 301', title: 'Pharmaceutical Biotechnology', units: 3 }], 400: [{ code: 'PMB 401', title: 'Research Project', units: 6 }] },
  PPT: { 100: [{ code: 'PPT 101', title: 'Introduction to Pharmaceutics', units: 3 }], 200: [{ code: 'PPT 201', title: 'Physical Pharmacy', units: 3 }], 300: [{ code: 'PPT 301', title: 'Pharmaceutical Technology', units: 3 }], 400: [{ code: 'PPT 401', title: 'Research Project', units: 6 }] },
  PGN: { 100: [{ code: 'PGN 101', title: 'Introduction to Pharmacognosy', units: 3 }], 200: [{ code: 'PGN 201', title: 'Natural Products Chemistry', units: 3 }], 300: [{ code: 'PGN 301', title: 'Phytochemistry', units: 3 }], 400: [{ code: 'PGN 401', title: 'Research Project', units: 6 }] },
  PTT: { 100: [{ code: 'PTT 101', title: 'Introduction to Pharmacology', units: 3 }], 200: [{ code: 'PTT 201', title: 'General Pharmacology', units: 3 }], 300: [{ code: 'PTT 301', title: 'Therapeutics', units: 3 }], 400: [{ code: 'PTT 401', title: 'Research Project', units: 6 }] },
  MBC: { 100: [{ code: 'MBC 101', title: 'Introduction to Medical Biochemistry', units: 3 }], 200: [{ code: 'MBC 201', title: 'Clinical Biochemistry', units: 3 }], 300: [{ code: 'MBC 301', title: 'Molecular Medicine', units: 3 }], 400: [{ code: 'MBC 401', title: 'Research Project', units: 6 }] },
  CRG: { 100: [{ code: 'CRS 101', title: 'Introduction to Christian Religious Studies', units: 3 }], 200: [{ code: 'CRS 201', title: 'Old Testament Studies', units: 3 }], 300: [{ code: 'CRS 301', title: 'New Testament Studies', units: 3 }], 400: [{ code: 'CRS 401', title: 'Research Project', units: 6 }] },
  LGA: { 100: [{ code: 'LGA 101', title: 'Introduction to Linguistics', units: 3 }], 200: [{ code: 'LGA 201', title: 'African Languages', units: 3 }], 300: [{ code: 'LGA 301', title: 'Yoruba Language', units: 3 }], 400: [{ code: 'LGA 401', title: 'Research Project', units: 6 }] },
  RUS: { 100: [{ code: 'RUS 101', title: 'Introduction to Russian Studies', units: 3 }], 200: [{ code: 'RUS 201', title: 'Russian Language I', units: 3 }], 300: [{ code: 'RUS 301', title: 'Russian Literature', units: 3 }], 400: [{ code: 'RUS 401', title: 'Research Project', units: 6 }] },
}

async function seed() {
  console.log('Starting UNILAG seed...\n')

  // 1. Insert faculties
  const facultyIds = {}
  for (const f of faculties) {
    const id = randomUUID()
    facultyIds[f.code] = id
    await query(
      'INSERT INTO public.faculties (id, name, code, description) VALUES ($1,$2,$3,$4) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name',
      [id, f.name, f.code, `${f.name} — University of Lagos`]
    )
  }
  console.log(`Seeded ${faculties.length} faculties`)

  // 2. Insert departments
  const deptIds = {}
  for (const d of departments) {
    const id = randomUUID()
    deptIds[d.code] = id
    const facId = facultyIds[d.faculty]
    await query(
      'INSERT INTO public.departments (id, name, code, faculty_id) VALUES ($1,$2,$3,$4) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, faculty_id = EXCLUDED.faculty_id',
      [id, d.name, d.code, facId]
    )
  }
  console.log(`Seeded ${departments.length} departments`)

  // 3. Insert courses
  let courseCount = 0
  for (const [deptCode, levels] of Object.entries(courseCatalog)) {
    const deptId = deptIds[deptCode]
    if (!deptId) continue
    const dept = departments.find(d => d.code === deptCode)
    const facId = dept ? facultyIds[dept.faculty] : null

    for (const [level, courses] of Object.entries(levels)) {
      for (const c of courses) {
        const id = randomUUID()
        await query(
          `INSERT INTO public.courses (id, code, title, level, units, department_id, faculty_id, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'active') ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, units = EXCLUDED.units`,
          [id, c.code, c.title, level, c.units, deptId, facId]
        )
        courseCount++
      }
    }
  }
  console.log(`Seeded ${courseCount} courses`)

  console.log('\nUNILAG seed complete!')
  console.log(`  ${faculties.length} faculties`)
  console.log(`  ${departments.length} departments`)
  console.log(`  ${courseCount} courses`)
}

seed().catch(err => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
