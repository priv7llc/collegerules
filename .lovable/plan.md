## Problem

When a user picks a non-CSU destination (UC Berkeley, a UC campus, or any private/out-of-state school), the generated dashboard still comes back as a CSU + AS-T + Cal-GETC plan. That's because:

1. `CreateRoutePage.tsx` hardcodes `destination_university: 'CSU System'` when inserting the route, ignoring the dropdown the user picked.
2. The dropdown only offers **CSU** or **UC** — there's no way to type a specific campus like "UC Berkeley" as the actual target system.
3. The `generate-route-dashboard` edge function never receives the destination — its prompt is hardcoded to `Target System: CSU`, `AS-T`, and Cal-GETC, so Gemini always builds a CSU plan.

## Fix

### 1. Capture destination correctly (frontend)

In `src/pages/app/CreateRoutePage.tsx`:
- Default `form.destinationUniversity` to `'CSU'` in initial state (so the Select shows it without falling back to the hardcoded display).
- On submit, save the actual chosen system + campus to the `routes` row:
  - `destination_university`: the selected system (`CSU`, `UC`, or "Other")
  - `destination_program`: the campus the user typed (e.g. "UC Berkeley") or `${major} ${track}` if blank
- Add a third option to the Target Transfer System dropdown: **"Other (private / out-of-state)"** so students aiming at Stanford, out-of-state schools, etc. aren't forced into CSU/UC.
- Pass the destination fields into the edge function invoke:
  ```ts
  body: {
    communityCollege, major, degreeType, state,
    destinationSystem: form.destinationUniversity,   // CSU | UC | Other
    destinationCampus: form.destinationProgram,      // free text, e.g. "UC Berkeley"
    routeId, userId,
  }
  ```

### 2. Make the AI prompt destination-aware (backend)

In `supabase/functions/generate-route-dashboard/index.ts`:
- Accept `destinationSystem` and `destinationCampus` from the request body (default `CSU` for backward compat).
- Branch the Firecrawl scrape queries on system:
  - **CSU** → keep current queries (Cal-GETC, CSU transfer center)
  - **UC** → search ASSIST.org articulation for `${campus || 'UC'}`, IGETC requirements, UC TAG agreements
  - **Other** → search the specific campus's transfer admission page + the community college's articulation with that campus
- Replace the hardcoded `Target System: CSU` and Cal-GETC-only instructions in the system/user prompt with conditional language:
  - System name comes from `destinationSystem` (and `destinationCampus` if provided)
  - GE pattern: Cal-GETC for CSU, **IGETC** for UC, "campus-specific GE" for Other
  - Degree path: AS-T/AA-T only when system is CSU; for UC mention TAG/UC Transfer Pathways; for Other tell the model to base it on articulation with that specific school
- Update `routeMeta.destinationSystem`, `nearbyCsus` (rename concept to `nearbyCampuses` in the prompt instructions but keep the JSON key for back-compat — populate it with relevant campuses for whichever system was chosen), and `adtGuarantee` (only meaningful for CSU; for UC swap to TAG language; for Other clarify no guarantee exists).

### 3. No DB migration needed

`routes.destination_university` and `destination_program` columns already exist; we're just using them properly.

### Out of scope

- Re-rendering existing already-generated CSU dashboards. Old routes stay as-is; only newly created routes after this fix will reflect the chosen destination. (Happy to add a "Regenerate dashboard" admin/user action as a follow-up if you want.)

## Files touched

- `src/pages/app/CreateRoutePage.tsx` — pass destination through, add "Other" option
- `supabase/functions/generate-route-dashboard/index.ts` — destination-aware scraping + prompt
