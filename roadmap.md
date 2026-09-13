# Roadmap

## Stage 1 — Design tokens + dashboard restyle — done
- Added Source Serif 4 + IBM Plex Sans, new ink/line/surface/accent tokens in `tailwind.config.ts`.
- Restyled route dashboard: navy gradient banner, 4 gradient stat cards, gold-underline scrollable tab bar.

## Stage 2 — Per-route unlock system — done
- `route_unlocks` table + RLS + helper functions (`unlock_summary`, `is_route_unlocked`, `redeem_unlock_slot`).
- Locked tabs: Affordability, Major Courses, Course Sequence, Transfer Guide, Resources (Overview + GE free).
- Blur + fade + unlock card with $1 / $3 (best value) / $10 tiers; pack holders redeem a free slot.
- Stripe: new unlock products in `create-checkout`; `stripe-webhook` and `verify-payment` insert unlock rows.

## Stage 3 — My Routes redesign — done
- Unlock/credit pills in header, status pills, course-progress bars, "Add another route" card.
- Nav item renamed to "Buy Unlocks".

## Open
- Stripe webhook signature verification is still skipped (dev setup).
