// State-aware transfer options shared by the intake wizard and route displays.

export type StateKey = 'California' | 'Texas' | 'Other';

export const STATES: StateKey[] = ['California', 'Texas', 'Other'];

export const COLLEGES_BY_STATE: Record<StateKey, string[]> = {
  California: [
    'Foothill College',
    'De Anza College',
    'Diablo Valley College',
    'Santa Monica College',
    'Pasadena City College',
    'Orange Coast College',
    'College of San Mateo',
    'Sierra College',
    'American River College',
    'Mt. San Antonio College',
  ],
  Texas: [
    'Houston City College',
    'Lone Star College',
    'San Jacinto College',
    'Austin Community College',
    'Dallas College',
    'Tarrant County College',
    'Alamo Colleges District',
    'Collin College',
    'El Paso Community College',
    'Blinn College',
  ],
  Other: [],
};

export interface DegreeOption {
  value: string;
  label: string;
}

export const DEGREE_TYPES_BY_STATE: Record<StateKey, DegreeOption[]> = {
  California: [
    { value: 'AS-T', label: 'AS-T (Associate in Science for Transfer)' },
    { value: 'AA-T', label: 'AA-T (Associate in Arts for Transfer)' },
  ],
  Texas: [
    { value: 'AA', label: 'AA (Associate of Arts)' },
    { value: 'AS', label: 'AS (Associate of Science)' },
    { value: 'AAT', label: 'AAT (Associate of Arts in Teaching)' },
    { value: 'AAS', label: 'AAS (Applied Science — workforce, e.g. AAS → BAAS)' },
    { value: 'Core', label: 'Core Curriculum only (42 SCH block transfer)' },
  ],
  Other: [
    { value: 'AA', label: 'AA (Associate of Arts)' },
    { value: 'AS', label: 'AS (Associate of Science)' },
    { value: 'AAS', label: 'AAS (Applied Science)' },
    { value: 'Transfer', label: 'Transfer coursework (no associate degree)' },
  ],
};

export interface DestinationOption {
  value: string;
  label: string;
}

export const DESTINATIONS_BY_STATE: Record<StateKey, DestinationOption[]> = {
  California: [
    { value: 'CSU', label: 'CSU (California State University)' },
    { value: 'UC', label: 'UC (University of California)' },
    { value: 'Other', label: 'Other (private / out-of-state)' },
  ],
  Texas: [
    { value: 'University of Houston', label: 'University of Houston' },
    { value: 'University of Houston–Downtown', label: 'University of Houston–Downtown' },
    { value: 'University of Houston–Clear Lake', label: 'University of Houston–Clear Lake' },
    { value: 'Texas Southern University', label: 'Texas Southern University' },
    { value: 'Prairie View A&M University', label: 'Prairie View A&M University' },
    { value: 'Sam Houston State University', label: 'Sam Houston State University' },
    { value: 'Texas A&M University', label: 'Texas A&M University (College Station)' },
    { value: 'Texas State University', label: 'Texas State University' },
    { value: 'Texas Tech University', label: 'Texas Tech University' },
    { value: 'The University of Texas at Austin', label: 'UT Austin' },
    { value: 'The University of Texas at San Antonio', label: 'UT San Antonio' },
    { value: 'Texas A&M University–Victoria', label: 'Texas A&M University–Victoria' },
    { value: 'Other Texas University', label: 'Other Texas university' },
    { value: 'Out-of-State', label: 'Out-of-state university' },
  ],
  Other: [
    { value: 'In-State Public', label: 'In-state public university' },
    { value: 'Out-of-State', label: 'Out-of-state university' },
    { value: 'Private', label: 'Private university' },
  ],
};

export const isTexasDestination = (sys: string | null | undefined): boolean => {
  const s = (sys || '').toLowerCase();
  return DESTINATIONS_BY_STATE.Texas.some(d => d.value.toLowerCase() === s);
};

/** Friendly label for a destination system code stored on a route. */
export const systemLabel = (sys: string | null): string => {
  const raw = (sys || '').trim();
  const s = raw.toUpperCase();
  if (s === 'CSU' || s === 'CSU SYSTEM') return 'CSU System';
  if (s === 'UC' || s === 'UC SYSTEM') return 'UC System';
  if (s === 'OTHER') return 'Other University';
  if (s === 'OUT-OF-STATE') return 'Out-of-State University';
  if (s === 'IN-STATE PUBLIC') return 'In-State Public University';
  if (s === 'PRIVATE') return 'Private University';
  return raw || 'CSU System';
};

/** GE pattern label used on the dashboard, by destination system. */
export const gePatternLabel = (sys: string | null | undefined): string => {
  const s = (sys || '').trim().toUpperCase();
  if (s === 'UC' || s === 'UC SYSTEM' || s === 'IGETC') return 'IGETC';
  if (s === 'CSU' || s === 'CSU SYSTEM' || s === 'CAL-GETC') return 'Cal-GETC';
  // Texas uses the state Core Curriculum, but on the dashboard we surface the
  // generic "General Education / GE" label so students never see California-only
  // terms (IGETC/Cal-GETC) on a Texas route. The Texas-specific description is
  // rendered separately on the GE tab.
  if (isTexasDestination(sys)) return 'General Education';
  return 'General Education';
};
