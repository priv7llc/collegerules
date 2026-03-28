// Mock dashboard payload generator
// This will be replaced by a real rules engine / AI generation later

export interface DashboardPayload {
  routeMeta: {
    communityCollege: string;
    major: string;
    destinationUniversity: string;
    destinationProgram?: string;
    catalogYear: string;
    transferTerm: string;
    lastUpdated: string;
  };
  overviewCards: Array<{ title: string; description: string; icon: string }>;
  warnings: Array<{ type: 'critical' | 'warning' | 'info'; message: string }>;
  majorCourses: Array<{
    key: string;
    code: string;
    name: string;
    units: number;
    description: string;
    prerequisites: string;
    notes: string;
  }>;
  geTransfer: Array<{
    area: string;
    title: string;
    required: number;
    courses: string[];
    notes: string;
  }>;
  courseSequence: Array<{
    term: string;
    courses: Array<{ code: string; name: string; units: number; type: 'major' | 'ge' | 'elective' }>;
    warnings: string[];
  }>;
  transferGuide: Array<{
    key: string;
    milestone: string;
    timing: string;
    description: string;
    category: 'application' | 'academic' | 'financial' | 'other';
  }>;
  quickStartChecklist: Array<{
    key: string;
    label: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  resources: Array<{
    title: string;
    url: string;
    type: 'catalog' | 'transfer' | 'department' | 'counselor' | 'support';
    description: string;
  }>;
  sourceInfo: {
    basedOn: string;
    lastVerified: string;
    notes: string[];
  };
}

export function generateMockDashboard(
  communityCollege: string,
  major: string,
  destinationUniversity: string,
  destinationProgram?: string,
  transferTerm?: string,
): DashboardPayload {
  const cc = communityCollege || 'Foothill College';
  const m = major || 'Computer Science';
  const du = destinationUniversity || 'UC Davis';
  const dp = destinationProgram || 'Computer Science B.S.';
  const tt = transferTerm || 'Fall 2026';

  return {
    routeMeta: {
      communityCollege: cc,
      major: m,
      destinationUniversity: du,
      destinationProgram: dp,
      catalogYear: '2025-2026',
      transferTerm: tt,
      lastUpdated: new Date().toISOString(),
    },
    overviewCards: [
      { title: 'Your Transfer Path', description: `${cc} → ${du}`, icon: 'map' },
      { title: 'Target Major', description: `${m} — ${dp}`, icon: 'book' },
      { title: 'Transfer Term', description: tt, icon: 'calendar' },
      { title: 'Key Requirement', description: 'Complete all major prep + GE pattern before transfer', icon: 'alert' },
    ],
    warnings: [
      { type: 'critical', message: 'Some courses have limited availability — plan early for MATH 1A-1C sequence.' },
      { type: 'warning', message: 'GPA requirements may vary by quarter. Verify minimum GPA with admissions.' },
      { type: 'info', message: 'Route is based on 2025-2026 catalog. Requirements may change. Always verify with a counselor.' },
    ],
    majorCourses: [
      { key: 'cs1a', code: 'CS 1A', name: 'Object-Oriented Programming Methodologies in Java', units: 4.5, description: 'Introduction to OOP using Java. Covers classes, objects, inheritance, polymorphism.', prerequisites: 'None', notes: 'Required. Take in first or second quarter.' },
      { key: 'cs1b', code: 'CS 1B', name: 'Intermediate Software Design in Java', units: 4.5, description: 'Data structures, algorithms, and software design patterns.', prerequisites: 'CS 1A', notes: 'Required. Take after CS 1A.' },
      { key: 'cs1c', code: 'CS 1C', name: 'Advanced Data Structures & Algorithms in Java', units: 4.5, description: 'Advanced topics: trees, graphs, sorting, complexity analysis.', prerequisites: 'CS 1B', notes: 'Required. Take after CS 1B.' },
      { key: 'cs2a', code: 'CS 2A', name: 'Object-Oriented Programming Methodologies in C++', units: 4.5, description: 'C++ programming with focus on OOP concepts.', prerequisites: 'CS 1A', notes: 'Strongly recommended.' },
      { key: 'math1a', code: 'MATH 1A', name: 'Calculus I', units: 5, description: 'Limits, derivatives, and introduction to integrals.', prerequisites: 'MATH 48C or placement', notes: 'Required. Start ASAP.' },
      { key: 'math1b', code: 'MATH 1B', name: 'Calculus II', units: 5, description: 'Techniques of integration, sequences, and series.', prerequisites: 'MATH 1A', notes: 'Required.' },
      { key: 'math1c', code: 'MATH 1C', name: 'Calculus III', units: 5, description: 'Multivariable calculus.', prerequisites: 'MATH 1B', notes: 'Required.' },
      { key: 'math2a', code: 'MATH 2A', name: 'Differential Equations', units: 5, description: 'First and second order ODEs.', prerequisites: 'MATH 1B', notes: 'Required for some tracks.' },
      { key: 'phys4a', code: 'PHYS 4A', name: 'Physics for Scientists & Engineers I', units: 5, description: 'Mechanics, waves, thermodynamics.', prerequisites: 'MATH 1A', notes: 'Required.' },
    ],
    geTransfer: [
      { area: 'Area 1', title: 'English Communication', required: 2, courses: ['ENGL 1A', 'ENGL 1B or ENGL 1T'], notes: 'Both courses required.' },
      { area: 'Area 2', title: 'Mathematical Concepts & Quantitative Reasoning', required: 1, courses: ['MATH 1A (also satisfies major req)'], notes: 'Satisfied by major course.' },
      { area: 'Area 3', title: 'Arts & Humanities', required: 3, courses: ['ART 1A', 'PHIL 1', 'HIST 17A', 'MUSIC 1'], notes: 'Choose 3 from approved list. At least one from Arts, one from Humanities.' },
      { area: 'Area 4', title: 'Social & Behavioral Sciences', required: 3, courses: ['PSYCH 1', 'SOC 1', 'ECON 1', 'POLI 1'], notes: 'Choose 3 from approved list.' },
      { area: 'Area 5', title: 'Physical & Biological Sciences', required: 2, courses: ['PHYS 4A (also major)', 'BIOL 10 or CHEM 1A'], notes: 'One lab science required.' },
    ],
    courseSequence: [
      { term: 'Fall 2024', courses: [
        { code: 'CS 1A', name: 'OOP in Java', units: 4.5, type: 'major' },
        { code: 'MATH 1A', name: 'Calculus I', units: 5, type: 'major' },
        { code: 'ENGL 1A', name: 'English Composition', units: 5, type: 'ge' },
      ], warnings: [] },
      { term: 'Winter 2025', courses: [
        { code: 'CS 1B', name: 'Intermediate Java', units: 4.5, type: 'major' },
        { code: 'MATH 1B', name: 'Calculus II', units: 5, type: 'major' },
        { code: 'ENGL 1B', name: 'Critical Reading & Writing', units: 5, type: 'ge' },
      ], warnings: [] },
      { term: 'Spring 2025', courses: [
        { code: 'CS 1C', name: 'Advanced Data Structures', units: 4.5, type: 'major' },
        { code: 'MATH 1C', name: 'Calculus III', units: 5, type: 'major' },
        { code: 'PSYCH 1', name: 'Intro to Psychology', units: 5, type: 'ge' },
      ], warnings: [] },
      { term: 'Fall 2025', courses: [
        { code: 'CS 2A', name: 'OOP in C++', units: 4.5, type: 'major' },
        { code: 'PHYS 4A', name: 'Physics I', units: 5, type: 'major' },
        { code: 'ART 1A', name: 'Art Appreciation', units: 3, type: 'ge' },
      ], warnings: ['Begin UC application in November!'] },
      { term: 'Winter 2026', courses: [
        { code: 'MATH 2A', name: 'Differential Equations', units: 5, type: 'major' },
        { code: 'SOC 1', name: 'Intro to Sociology', units: 3, type: 'ge' },
        { code: 'PHIL 1', name: 'Intro to Philosophy', units: 3, type: 'ge' },
      ], warnings: [] },
      { term: 'Spring 2026', courses: [
        { code: 'BIOL 10', name: 'Intro Biology', units: 4, type: 'ge' },
        { code: 'HIST 17A', name: 'US History', units: 3, type: 'ge' },
      ], warnings: ['Final term before transfer — verify all requirements are met!'] },
    ],
    transferGuide: [
      { key: 'tg1', milestone: 'Meet with a counselor', timing: 'First quarter', description: 'Create a comprehensive Student Educational Plan (SEP) with your counselor.', category: 'academic' },
      { key: 'tg2', milestone: 'Complete TAG application', timing: 'September 1-30', description: 'Submit Transfer Admission Guarantee application if eligible for UC Davis TAG.', category: 'application' },
      { key: 'tg3', milestone: 'Submit UC application', timing: 'November 1-30', description: 'Complete UC Application for fall transfer admission.', category: 'application' },
      { key: 'tg4', milestone: 'Apply for financial aid', timing: 'October - March', description: 'Submit FAFSA/CADAA by March 2 priority deadline.', category: 'financial' },
      { key: 'tg5', milestone: 'Complete IGETC/CSU GE', timing: 'Before transfer', description: 'Finish all GE pattern courses and request certification.', category: 'academic' },
      { key: 'tg6', milestone: 'Request final transcripts', timing: 'After spring grades', description: 'Send official transcripts to your destination university.', category: 'application' },
    ],
    quickStartChecklist: [
      { key: 'qs1', label: 'Review your dashboard and understand your route', priority: 'high' },
      { key: 'qs2', label: 'Meet with an academic counselor to verify this plan', priority: 'high' },
      { key: 'qs3', label: 'Register for next quarter\'s courses', priority: 'high' },
      { key: 'qs4', label: 'Check prerequisite clearances', priority: 'medium' },
      { key: 'qs5', label: 'Explore TAG eligibility for UC Davis', priority: 'medium' },
      { key: 'qs6', label: 'Set up ASSIST.org account and review articulation', priority: 'medium' },
      { key: 'qs7', label: 'Visit the Transfer Center on campus', priority: 'low' },
      { key: 'qs8', label: 'Join transfer student clubs/communities', priority: 'low' },
    ],
    resources: [
      { title: `${cc} Course Catalog`, url: 'https://www.foothill.edu/catalog/', type: 'catalog', description: 'Official course catalog and program requirements.' },
      { title: 'ASSIST.org', url: 'https://assist.org/', type: 'transfer', description: 'Official articulation agreements between CA colleges and universities.' },
      { title: `${du} Admissions`, url: 'https://www.ucdavis.edu/admissions', type: 'transfer', description: 'Transfer admission requirements and deadlines.' },
      { title: `${du} ${m} Department`, url: 'https://cs.ucdavis.edu/', type: 'department', description: 'Department information, advising, and program details.' },
      { title: `${cc} Transfer Center`, url: 'https://www.foothill.edu/transfer/', type: 'counselor', description: 'On-campus transfer advising and workshop information.' },
      { title: 'UC Application Portal', url: 'https://apply.universityofcalifornia.edu/', type: 'transfer', description: 'Submit your UC transfer application.' },
    ],
    sourceInfo: {
      basedOn: `${cc} catalog 2025-2026, ASSIST.org articulation data, ${du} admission requirements`,
      lastVerified: new Date().toISOString(),
      notes: [
        'Requirements are based on available official data and may change.',
        'Always verify with your academic counselor before making enrollment decisions.',
        'This route is based on user-provided information and available source data.',
      ],
    },
  };
}
