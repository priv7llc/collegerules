## Problems

**1. No scholarships shown for paulriveramm@gmail.com**

The RPC `match_scholarships_for_user` is returning HTTP 400:

```
column reference "deadline" is ambiguous
```

In the candidate loop (lines 186–209 of the latest migration), the function does:

```sql
FOR cand IN
  SELECT * FROM public.scholarship_candidates
  WHERE discovered_for_user_id = _user_id
    AND status = 'pending'
    AND (deadline IS NULL OR deadline >= CURRENT_DATE)  -- ambiguous
```

`deadline` is also declared as an OUT column in `RETURNS TABLE(... deadline date ...)`, so Postgres can't tell which one we mean. The whole RPC fails, which is why the scholarships list is empty even though the profile is 100% complete and there are valid catalog scholarships.

**2. Can't open started applications to edit essays**

The detail page already supports the in-progress workspace with essay editing (`ScholarshipDetailPage` VIEW B). The problem is on `ApplicationsPage`: the kanban cards only make the small title text a link. On a 440px-wide mobile viewport, that's a tiny tap target, and there's no obvious "Continue" affordance. Users don't realize the card is interactive.

## Fix

### Part 1 — Migration: repair `match_scholarships_for_user`

New migration that re-creates the function, identical to the current one except the candidate loop uses an alias and qualifies the column:

```sql
FOR cand IN
  SELECT sc2.* FROM public.scholarship_candidates sc2
  WHERE sc2.discovered_for_user_id = _user_id
    AND sc2.status = 'pending'
    AND (sc2.deadline IS NULL OR sc2.deadline >= CURRENT_DATE)
  ORDER BY sc2.relevance_score DESC NULLS LAST, sc2.deadline ASC NULLS LAST
LOOP
  ...
END LOOP;
```

This unblocks both catalog matches and AI-discovered personal candidates for paulriveramm.

### Part 2 — `ApplicationsPage` card UX

Update `AppCard` so the whole card is tappable and editable applications get a clear CTA:

- Wrap the card in a `<Link to={/app/scholarships/${s.id}}>` (only when the scholarship still exists), with `hover:shadow-md` and `cursor-pointer`.
- For `saved` and `in_progress` cards, add a small footer button: "Continue" (in_progress) or "Start" (saved) using the same link, so the action is unmistakable on mobile.
- For `submitted` / `won` / `lost`, keep the card linked but no extra button (the status badge tells the story).
- Stop the inner title `<Link>` from nesting inside the wrapper link.

No other behavior changes; the detail page already routes correctly to VIEW B for `in_progress` and lets the user edit essays.
