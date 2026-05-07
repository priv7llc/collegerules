ALTER TABLE public.scholarship_candidates ADD COLUMN IF NOT EXISTS relevance_score numeric;
ALTER TABLE public.scholarship_candidates ADD COLUMN IF NOT EXISTS relevance_reasoning text;