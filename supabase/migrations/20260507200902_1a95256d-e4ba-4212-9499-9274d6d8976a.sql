-- Enum for candidate review status
CREATE TYPE public.candidate_status AS ENUM ('pending', 'approved', 'rejected', 'duplicate');

-- Scholarship candidates table (admin review queue)
CREATE TABLE public.scholarship_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sponsor text,
  amount_cents integer,
  deadline date,
  description text,
  eligibility_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  essay_prompts jsonb NOT NULL DEFAULT '[]'::jsonb,
  external_url text,
  source_query text,
  source_url text,
  confidence_score numeric,
  status public.candidate_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scholarship_candidates_name_sponsor_unique UNIQUE (name, sponsor)
);

ALTER TABLE public.scholarship_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view candidates"
  ON public.scholarship_candidates
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage candidates"
  ON public.scholarship_candidates
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_scholarship_candidates_status ON public.scholarship_candidates(status);
CREATE INDEX idx_scholarship_candidates_created_at ON public.scholarship_candidates(created_at DESC);

-- Schedule weekly discovery run
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'discover-scholarships-weekly',
  '0 0 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://fgppndfkzohyfrykplzx.supabase.co/functions/v1/discover-scholarships',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncHBuZGZrem9oeWZyeWtwbHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjQ3ODgsImV4cCI6MjA5MDMwMDc4OH0.90-Dp4hKvacmhUg4hrvArmE0GHNZhIdpodqCpRSGq38"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);