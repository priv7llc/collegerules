## Problem

The route card shows **"To: CSU System"** even when the user picked UC + typed "Berkeley". Two separate issues:

1. **Old routes have stale data.** Routes created before the recent destination fix were inserted with `destination_university = 'CSU System'` regardless of what the user picked. The intake form did capture the real choice in `route_inputs.raw_form_payload` (e.g. `destinationUniversity: 'UC'`, `destinationProgram: 'Berkeley'`), but the `routes` row was wrong.
2. **The card UI never shows the campus.** Even for new (correctly-saved) routes it only renders `destination_university` and ignores `destination_program`, so "UC + Berkeley" would still just say "UC".

## Fix

### 1. Backfill existing routes (one-time SQL migration)

For every `routes` row where `destination_university = 'CSU System'`, copy the real values from `route_inputs.raw_form_payload`:
- `destination_university` ← `raw_form_payload->>'destinationUniversity'` (fallback `'CSU'`)
- `destination_program` ← `raw_form_payload->>'destinationProgram'` when non-empty, else keep existing

This corrects the Diablo Valley → Berkeley route and any other backlog rows.

### 2. Improve card display (`src/pages/app/MyRoutesPage.tsx`)

Add a small `formatDestination(university, program)` helper:
- Map system codes to friendly labels: `CSU` → "CSU System", `UC` → "UC System", `Other` → "Other University", anything else → as-is.
- If `destination_program` is set and looks like a campus name (not just `${major} AS-T`), render it as a second line: **"To: UC System — UC Berkeley"**.

Apply the same helper to:
- The card's `To:` line
- The `route_name` fallback at line 118

### Out of scope

- Re-generating the AI dashboard for those backfilled old routes. The new routes going forward will already be correct; if you want, I can add a "Regenerate dashboard" button as a follow-up.

## Files touched

- New migration: `UPDATE routes SET destination_university/destination_program FROM route_inputs.raw_form_payload WHERE destination_university = 'CSU System'`
- `src/pages/app/MyRoutesPage.tsx` — friendly label helper + show campus
