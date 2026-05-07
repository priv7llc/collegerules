-- PART 1: scholarship_profiles table
CREATE TABLE public.scholarship_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ethnicities text[],
  gender text,
  lgbtq boolean,
  first_generation_college boolean,
  citizenship_status text,
  veteran_or_military_family boolean,
  disability_status boolean,
  religion text,
  state_of_residence text DEFAULT 'CA',
  city text,
  zip_code text,
  pell_grant_eligible boolean,
  household_income_range text,
  single_parent_household boolean,
  current_gpa numeric(3,2),
  intended_major text,
  career_goal text,
  community_service_hours integer,
  leadership_roles text[],
  sports text[],
  arts_activities text[],
  clubs_organizations text[],
  work_experience jsonb DEFAULT '[]'::jsonb,
  challenges_overcome text,
  unique_attributes text,
  career_motivation text,
  profile_completeness integer NOT NULL DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scholarship_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.scholarship_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.scholarship_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.scholarship_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON public.scholarship_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all scholarship profiles"
  ON public.scholarship_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_scholarship_profiles_updated_at
  BEFORE UPDATE ON public.scholarship_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PART 2: replace match_scholarships_for_user
DROP FUNCTION IF EXISTS public.match_scholarships_for_user(uuid);

CREATE OR REPLACE FUNCTION public.match_scholarships_for_user(_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  sponsor text,
  amount_cents integer,
  deadline date,
  description text,
  eligibility_criteria jsonb,
  essay_prompts jsonb,
  external_url text,
  active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  match_score integer,
  match_reasons text[]
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prof public.scholarship_profiles%ROWTYPE;
  ri public.route_inputs%ROWTYPE;
  r public.routes%ROWTYPE;
  s public.scholarships%ROWTYPE;
  has_profile boolean := false;
  score integer;
  reasons text[];
  crit jsonb;
  req_gender text;
  req_min_gpa numeric;
  req_ethnicities text[];
  req_states text[];
  req_citizenship text;
  req_first_gen boolean;
  req_pell boolean;
  req_majors text[];
  req_activities text[];
  has_restrictive boolean;
  satisfied_all boolean;
  reject boolean;
  user_major text;
  user_gpa numeric;
BEGIN
  SELECT * INTO prof FROM public.scholarship_profiles WHERE user_id = _user_id LIMIT 1;
  IF FOUND THEN has_profile := true; END IF;

  SELECT * INTO r FROM public.routes WHERE user_id = _user_id ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN
    SELECT * INTO ri FROM public.route_inputs WHERE route_id = r.id LIMIT 1;
  END IF;

  user_major := COALESCE(prof.intended_major, r.major);
  user_gpa := COALESCE(prof.current_gpa, ri.gpa);

  FOR s IN
    SELECT * FROM public.scholarships
    WHERE active = true AND (deadline IS NULL OR deadline >= CURRENT_DATE)
  LOOP
    score := 50;
    reasons := ARRAY[]::text[];
    reject := false;

    IF NOT has_profile THEN
      id := s.id; name := s.name; sponsor := s.sponsor; amount_cents := s.amount_cents;
      deadline := s.deadline; description := s.description; eligibility_criteria := s.eligibility_criteria;
      essay_prompts := s.essay_prompts; external_url := s.external_url; active := s.active;
      created_at := s.created_at; updated_at := s.updated_at;
      match_score := 50;
      match_reasons := ARRAY['Complete your profile for personalized matches'];
      RETURN NEXT;
      CONTINUE;
    END IF;

    crit := COALESCE(s.eligibility_criteria, '{}'::jsonb);
    req_gender := crit->>'gender';
    req_min_gpa := NULLIF(crit->>'min_gpa','')::numeric;
    req_ethnicities := CASE WHEN jsonb_typeof(crit->'ethnicities')='array'
      THEN ARRAY(SELECT jsonb_array_elements_text(crit->'ethnicities')) ELSE NULL END;
    req_states := CASE WHEN jsonb_typeof(crit->'states')='array'
      THEN ARRAY(SELECT jsonb_array_elements_text(crit->'states')) ELSE NULL END;
    req_citizenship := crit->>'citizenship';
    req_first_gen := NULLIF(crit->>'first_generation','')::boolean;
    req_pell := NULLIF(crit->>'pell_eligible','')::boolean;
    req_majors := CASE WHEN jsonb_typeof(crit->'majors')='array'
      THEN ARRAY(SELECT jsonb_array_elements_text(crit->'majors')) ELSE NULL END;
    req_activities := CASE WHEN jsonb_typeof(crit->'activities')='array'
      THEN ARRAY(SELECT jsonb_array_elements_text(crit->'activities')) ELSE NULL END;

    has_restrictive := req_gender IS NOT NULL OR req_min_gpa IS NOT NULL OR req_ethnicities IS NOT NULL
      OR req_states IS NOT NULL OR req_citizenship IS NOT NULL OR req_first_gen IS NOT NULL
      OR req_pell IS NOT NULL OR req_majors IS NOT NULL;
    satisfied_all := true;

    -- Hard rejections
    IF req_gender IS NOT NULL AND prof.gender IS NOT NULL AND lower(prof.gender) <> lower(req_gender) THEN reject := true; END IF;
    IF req_min_gpa IS NOT NULL AND user_gpa IS NOT NULL AND user_gpa < req_min_gpa THEN reject := true; END IF;
    IF req_ethnicities IS NOT NULL AND prof.ethnicities IS NOT NULL AND NOT (prof.ethnicities && req_ethnicities) THEN reject := true; END IF;
    IF req_states IS NOT NULL AND prof.state_of_residence IS NOT NULL AND NOT (prof.state_of_residence = ANY(req_states)) THEN reject := true; END IF;
    IF req_citizenship IS NOT NULL AND prof.citizenship_status IS NOT NULL AND lower(prof.citizenship_status) <> lower(req_citizenship) THEN reject := true; END IF;

    IF reject THEN CONTINUE; END IF;

    -- Positive matches
    IF req_ethnicities IS NOT NULL AND prof.ethnicities IS NOT NULL AND prof.ethnicities && req_ethnicities THEN
      score := score + 10; reasons := array_append(reasons, 'Ethnicity match');
    ELSIF req_ethnicities IS NOT NULL THEN satisfied_all := false; END IF;

    IF req_first_gen IS TRUE AND prof.first_generation_college IS TRUE THEN
      score := score + 10; reasons := array_append(reasons, 'First-generation');
    ELSIF req_first_gen IS TRUE AND prof.first_generation_college IS NOT TRUE THEN satisfied_all := false; END IF;

    IF req_min_gpa IS NOT NULL AND user_gpa IS NOT NULL AND user_gpa >= req_min_gpa THEN
      score := score + 10; reasons := array_append(reasons, 'GPA above ' || req_min_gpa::text);
    ELSIF req_min_gpa IS NOT NULL THEN satisfied_all := false; END IF;

    IF req_states IS NOT NULL AND prof.state_of_residence = ANY(req_states) THEN
      score := score + 10; reasons := array_append(reasons, prof.state_of_residence || ' resident');
    ELSIF prof.state_of_residence = 'CA' THEN
      score := score + 10; reasons := array_append(reasons, 'California resident');
    END IF;

    IF req_majors IS NOT NULL AND user_major IS NOT NULL AND EXISTS(
      SELECT 1 FROM unnest(req_majors) m WHERE lower(user_major) LIKE '%' || lower(m) || '%'
    ) THEN
      score := score + 10; reasons := array_append(reasons, 'Major match');
    ELSIF req_majors IS NOT NULL THEN satisfied_all := false; END IF;

    IF req_pell IS TRUE AND prof.pell_grant_eligible IS TRUE THEN
      score := score + 10; reasons := array_append(reasons, 'Pell-eligible');
    ELSIF req_pell IS TRUE AND prof.pell_grant_eligible IS NOT TRUE THEN satisfied_all := false; END IF;

    -- Activity overlap
    IF prof.community_service_hours IS NOT NULL AND prof.community_service_hours > 0 THEN
      score := score + 5; reasons := array_append(reasons, 'Community service');
    END IF;
    IF prof.leadership_roles IS NOT NULL AND array_length(prof.leadership_roles,1) > 0 THEN
      score := score + 5; reasons := array_append(reasons, 'Leadership experience');
    END IF;

    IF NOT has_restrictive THEN
      score := score + 20; reasons := array_append(reasons, 'Open eligibility');
    ELSIF satisfied_all THEN
      score := score + 20; reasons := array_append(reasons, 'Meets all criteria');
    END IF;

    IF score > 100 THEN score := 100; END IF;

    id := s.id; name := s.name; sponsor := s.sponsor; amount_cents := s.amount_cents;
    deadline := s.deadline; description := s.description; eligibility_criteria := s.eligibility_criteria;
    essay_prompts := s.essay_prompts; external_url := s.external_url; active := s.active;
    created_at := s.created_at; updated_at := s.updated_at;
    match_score := score;
    match_reasons := reasons;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;