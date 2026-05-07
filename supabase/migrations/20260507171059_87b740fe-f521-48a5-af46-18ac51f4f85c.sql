
-- Enum
CREATE TYPE public.scholarship_status AS ENUM ('saved','in_progress','submitted','won','lost');

-- scholarships
CREATE TABLE public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sponsor text,
  amount_cents integer NOT NULL,
  deadline date,
  description text,
  eligibility_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  essay_prompts jsonb NOT NULL DEFAULT '[]'::jsonb,
  external_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active scholarships"
  ON public.scholarships FOR SELECT
  TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage scholarships"
  ON public.scholarships FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_scholarships_updated_at
  BEFORE UPDATE ON public.scholarships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- scholarship_applications
CREATE TABLE public.scholarship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id uuid NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  route_id uuid REFERENCES public.routes(id) ON DELETE SET NULL,
  status public.scholarship_status NOT NULL DEFAULT 'saved',
  submitted_at timestamptz,
  amount_won_cents integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scholarship_id)
);
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON public.scholarship_applications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own applications"
  ON public.scholarship_applications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all applications"
  ON public.scholarship_applications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_scholarship_applications_updated_at
  BEFORE UPDATE ON public.scholarship_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- essays
CREATE TABLE public.essays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.scholarship_applications(id) ON DELETE SET NULL,
  title text,
  prompt text,
  content text,
  word_count integer,
  tone text,
  is_template boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.essays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own essays"
  ON public.essays FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own essays"
  ON public.essays FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all essays"
  ON public.essays FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_essays_updated_at
  BEFORE UPDATE ON public.essays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Matching function
CREATE OR REPLACE FUNCTION public.match_scholarships_for_user(_user_id uuid)
RETURNS SETOF public.scholarships
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.scholarships
  WHERE active = true
    AND (deadline IS NULL OR deadline >= CURRENT_DATE)
  ORDER BY deadline ASC NULLS LAST;
$$;

-- Seed 8 California-relevant transfer scholarships
INSERT INTO public.scholarships (name, sponsor, amount_cents, deadline, description, eligibility_criteria, essay_prompts, external_url) VALUES
('Jack Kent Cooke Undergraduate Transfer Scholarship', 'Jack Kent Cooke Foundation', 5500000, (CURRENT_DATE + INTERVAL '90 days')::date,
 'Up to $55,000 per year for high-achieving community college students transferring to a four-year university.',
 '{"min_gpa":3.5,"transfer_status":"transferring","grade_levels":["sophomore"]}'::jsonb,
 '[{"prompt":"Describe a significant challenge you have overcome and what you learned from it.","max_words":500},{"prompt":"What are your academic and career goals after transfer?","max_words":500}]'::jsonb,
 'https://www.jkcf.org/our-scholarships/undergraduate-transfer-scholarship/'),

('Phi Theta Kappa Transfer Scholarship', 'Phi Theta Kappa Honor Society', 100000, (CURRENT_DATE + INTERVAL '120 days')::date,
 'Awards for PTK members transferring from a community college to a four-year institution.',
 '{"min_gpa":3.5,"transfer_status":"transferring"}'::jsonb,
 '[{"prompt":"How has your involvement in Phi Theta Kappa shaped your academic journey?","max_words":400}]'::jsonb,
 'https://www.ptk.org/scholarships/'),

('California Community College Transfer Scholarship', 'Foundation for California Community Colleges', 200000, (CURRENT_DATE + INTERVAL '60 days')::date,
 'Supports California community college students transferring to a CSU or UC.',
 '{"min_gpa":3.0,"states":["CA"],"transfer_status":"transferring"}'::jsonb,
 '[{"prompt":"Why are you pursuing your chosen major and how will it impact your community?","max_words":500}]'::jsonb,
 'https://foundationccc.org/'),

('Osher Initiative Scholarship', 'Bernard Osher Foundation', 100000, (CURRENT_DATE + INTERVAL '150 days')::date,
 'Awarded to California community college students demonstrating financial need and academic promise.',
 '{"states":["CA"],"min_gpa":2.5}'::jsonb,
 '[{"prompt":"Describe your educational goals and any financial barriers you face.","max_words":350}]'::jsonb,
 'https://foundationccc.org/osher/'),

('UC Transfer Admission Guarantee Scholarship', 'University of California', 250000, (CURRENT_DATE + INTERVAL '75 days')::date,
 'For California community college students with a TAG agreement transferring to a UC campus.',
 '{"states":["CA"],"min_gpa":3.2,"transfer_status":"transferring"}'::jsonb,
 '[{"prompt":"Reflect on a community college experience that prepared you for UC-level coursework.","max_words":500}]'::jsonb,
 'https://admission.universityofcalifornia.edu/admission-requirements/transfer-requirements/transfer-admission-guarantee-tag.html'),

('Hispanic Scholarship Fund General Scholarship', 'Hispanic Scholarship Fund', 500000, (CURRENT_DATE + INTERVAL '45 days')::date,
 'Supports students of Hispanic heritage pursuing higher education, including community college transfers.',
 '{"min_gpa":3.0,"ethnicities":["Hispanic","Latino"]}'::jsonb,
 '[{"prompt":"How has your cultural background influenced your educational path?","max_words":400},{"prompt":"What are your long-term career aspirations?","max_words":300}]'::jsonb,
 'https://www.hsf.net/scholarship'),

('Cal Grant Transfer Entitlement Award', 'California Student Aid Commission', 1290000, (CURRENT_DATE + INTERVAL '30 days')::date,
 'Provides tuition assistance for California community college students transferring to a four-year institution.',
 '{"states":["CA"],"min_gpa":2.4,"transfer_status":"transferring"}'::jsonb,
 '[]'::jsonb,
 'https://www.csac.ca.gov/cal-grants'),

('First Generation Matters Scholarship', 'Center for First-Generation Student Success', 250000, (CURRENT_DATE + INTERVAL '100 days')::date,
 'Supports first-generation college students transferring from community college to a four-year university.',
 '{"first_gen":true,"transfer_status":"transferring","min_gpa":3.0}'::jsonb,
 '[{"prompt":"What does being a first-generation college student mean to you?","max_words":500}]'::jsonb,
 'https://firstgen.naspa.org/');
