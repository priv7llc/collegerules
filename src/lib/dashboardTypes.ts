// Dashboard payload types matching the rich AS-T example format

export interface DashboardPayload {
  routeMeta: {
    communityCollege: string;
    major: string;
    degreeType: string; // e.g. "AS-T", "AA-T", "AS", "AA"
    degreeName: string; // e.g. "Business Administration 2.0 AS-T"
    destinationSystem: string; // e.g. "CSU", "UC"
    catalogYear: string;
    totalUnitsRequired: number;
    majorUnits: number;
    lastUpdated: string;
  };
  overviewCards: Array<{
    title: string;
    description: string;
    icon: string;
    boldText?: string;
  }>;
  keyRequirements: Array<{
    text: string;
    boldPart?: string;
  }>;
  criticalNotes: Array<{
    text: string;
    boldPart?: string;
    link?: { label: string; url: string };
  }>;
  quickStartChecklist: Array<{
    key: string;
    label: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  majorCourses: Array<{
    key: string;
    code: string;
    name: string;
    units: number;
    description: string;
    prerequisites: string;
    notes: string;
    alternatives?: Array<{ code: string; name: string }>;
    honorsAvailable?: boolean;
  }>;
  gradingRules: string[];
  calGetcAreas: Array<{
    key: string;
    area: string;
    title: string;
    description: string;
    exampleCourses: string[];
    notes: string;
    doubleDip?: boolean;
    doubleDipNote?: string;
  }>;
  geNotes: string[];
  courseSequence: Array<{
    term: string;
    label: string;
    description: string;
    courses: Array<{
      code: string;
      name?: string;
      type: 'major' | 'ge' | 'elective';
      geArea?: string;
    }>;
  }>;
  sequenceBottlenecks: string[];
  sequenceProTips: string[];
  transferGuide: Array<{
    key: string;
    step: number;
    title: string;
    description: string;
    link?: { label: string; url: string };
  }>;
  nearbyCsus?: Array<{
    name: string;
    distance: string;
    notes: string;
  }>;
  transferDeadlines: Array<{
    date: string;
    description: string;
  }>;
  adtGuarantee?: {
    guarantees: string[];
    doesNotGuarantee: string[];
  };
  resources: Array<{
    title: string;
    description: string;
    url: string;
    type: 'catalog' | 'transfer' | 'department' | 'counselor' | 'application' | 'articulation' | 'adt';
  }>;
  contactInfo?: {
    generalCounseling?: string;
    transferCenter?: string;
    inPerson?: string;
    dropIn?: string[];
  };
  sourceInfo: {
    basedOn: string;
    lastVerified: string;
    notes: string[];
  };
}
