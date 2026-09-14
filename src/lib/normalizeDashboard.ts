import type { DashboardPayload } from '@/lib/dashboardTypes';

/** Fields the UI renders with .map() — the AI sometimes returns a single string. */
const TOP_LEVEL_ARRAY_FIELDS = [
  'overviewCards', 'keyRequirements', 'criticalNotes', 'quickStartChecklist',
  'majorCourses', 'gradingRules', 'calGetcAreas', 'geNotes', 'courseSequence',
  'sequenceBottlenecks', 'sequenceProTips', 'transferGuide', 'nearbyCsus',
  'transferDeadlines', 'resources',
];

const toArray = (v: unknown): unknown[] => {
  if (Array.isArray(v)) return v;
  if (v === null || v === undefined || v === '') return [];
  if (typeof v === 'object') return Object.values(v as Record<string, unknown>);
  return [v];
};

/**
 * Defensive normalization: guarantees every list the dashboard renders is an
 * array so a malformed AI payload can't blank the page.
 */
export function normalizeDashboardPayload(raw: unknown): DashboardPayload {
  const d: Record<string, any> = { ...(raw as Record<string, any> ?? {}) };

  for (const key of TOP_LEVEL_ARRAY_FIELDS) {
    if (key in d) d[key] = toArray(d[key]);
  }

  d.majorCourses = toArray(d.majorCourses).map((c: any) => ({
    ...c,
    alternatives: c?.alternatives ? toArray(c.alternatives) : c?.alternatives,
  }));

  d.calGetcAreas = toArray(d.calGetcAreas).map((a: any) => ({
    ...a,
    courses: a?.courses ? toArray(a.courses) : a?.courses,
    options: a?.options ? toArray(a.options) : a?.options,
  }));

  d.courseSequence = toArray(d.courseSequence).map((t: any) => ({
    ...t,
    courses: toArray(t?.courses),
  }));

  if (d.adtGuarantee) {
    d.adtGuarantee = {
      ...d.adtGuarantee,
      guarantees: toArray(d.adtGuarantee.guarantees),
      doesNotGuarantee: toArray(d.adtGuarantee.doesNotGuarantee),
    };
  }

  if (d.contactInfo?.dropIn !== undefined) {
    d.contactInfo = { ...d.contactInfo, dropIn: toArray(d.contactInfo.dropIn) };
  }

  if (d.sourceInfo?.notes !== undefined) {
    d.sourceInfo = { ...d.sourceInfo, notes: toArray(d.sourceInfo.notes) };
  }

  return d as DashboardPayload;
}
