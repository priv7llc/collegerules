# Add Texas transfer support

Right now the whole product assumes California: the intake wizard defaults to California, degree types are only AS-T/AA-T, destinations are only CSU/UC/Other, and the AI generator reasons in Cal-GETC/IGETC/ASSIST.org terms. This adds Texas as a first-class state, starting with Houston City College (formerly Houston Community College).

## 1. Intake wizard becomes state-aware (`CreateRoutePage.tsx`)

- Step 1 gets a **State** dropdown (California, Texas, Other) instead of a free-text field, and the community-college field offers suggestions for the chosen state (Texas list seeded with Houston City College and the other large TX districts; "Other" still allows free text).
- **Degree type** options switch by state:
  - California: AS-T, AA-T (unchanged)
  - Texas: AA, AS, AAT (teaching), AAS (workforce), Core Curriculum only
- **Destination** options switch by state:
  - California: CSU, UC, Other (unchanged)
  - Texas: University of Houston, UH–Downtown, UH–Clear Lake, Texas Southern, Prairie View A&M, Sam Houston State, Texas A&M, Texas State, Texas Tech, UT Austin, UT San Antonio, Texas A&M–Victoria, Other Texas university, Out-of-state
- The state is saved on the route and passed to the generator so the plan is built with the right rules.

## 2. AI generator gets a Texas branch (`generate-route-dashboard`)

A third reasoning path alongside the existing CSU and UC ones:

- Searches Texas sources: the college's catalog and degree plans, TCCNS course numbers, the receiving university's transfer-equivalency tool, published articulation/pathway agreements, and ApplyTexas deadlines.
- Uses the **Texas Core Curriculum (42 semester credit hours, Components 010–090)** in place of Cal-GETC/IGETC, and **Fields of Study / Texas Transfer Framework** in place of the ADT guarantee.
- Labels every course with its **TCCNS number** where one exists, and states plainly when a course transfers as an elective rather than counting toward the degree.
- Handles the AAS → BAAS route (e.g. HCC AAS → UHD BAAS) as a distinct pathway, not a traditional AA/AS transfer.
- Never claims a guaranteed admission where Texas law only guarantees core-curriculum block transfer.

## 3. Dashboard labels adapt (`RouteDashboardPage.tsx`)

The GE tab currently says "Cal-GETC". It becomes "Core Curriculum" for Texas routes and "IGETC" for UC routes, driven by the payload's destination system. Same fixed template, no new payload contract.

## 4. Route cards and metadata (`MyRoutesPage.tsx`)

Friendly destination labels extended for Texas so a card reads "To: University of Houston" rather than a raw code.

## 5. Seed data (migration)

- Add Texas community colleges to `source_colleges` (Houston City College plus the other major districts), keeping "Houston Community College" as a searchable legacy name.
- Add Texas cost-of-attendance rows to `university_costs` (UH, UHD, UHCL, TSU, PVAMU, SHSU, TAMU, Texas State, TTU, UT Austin, UTSA) so the Affordability tab works for Texas routes.

## Out of scope for this pass

The full course-catalog warehouse from your outline (`institutions`, `courses`, `course_identifiers`, `course_equivalencies`, `degree_requirements`, `transfer_agreements`, `transfer_policies`, `source_records`) plus the `refresh-transfer-data` / `verify-transfer-route` admin pipeline. That is a separate, larger build — this pass makes Texas routes generate correctly end to end using the existing AI-retrieval approach. Say the word and I'll plan that warehouse next.
