
CREATE OR REPLACE FUNCTION public.match_scholarships_for_user(_user_id uuid)
 RETURNS TABLE(id uuid, name text, sponsor text, amount_cents integer, deadline date, description text, eligibility_criteria jsonb, essay_prompts jsonb, external_url text, active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, match_score integer, match_reasons text[], is_personal_discovery boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prof public.scholarship_profiles%ROWTYPE;
  ri public.route_inputs%ROWTYPE;
  r public.routes%ROWTYPE;
  s public.scholarships%ROWTYPE;
  cand public.scholarship_candidates%ROWTYPE;
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
    SELECT sc.* FROM public.scholarships sc
    WHERE sc.active = true AND (sc.deadline IS NULL OR sc.deadline >= CURRENT_DATE)
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
      is_personal_discovery := false;
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

    IF req_gender IS NOT NULL AND prof.gender IS NOT NULL AND lower(prof.gender) <> lower(req_gender) THEN reject := true; END IF;
    IF req_min_gpa IS NOT NULL AND user_gpa IS NOT NULL AND user_gpa < req_min_gpa THEN reject := true; END IF;
    IF req_ethnicities IS NOT NULL AND prof.ethnicities IS NOT NULL AND NOT (prof.ethnicities && req_ethnicities) THEN reject := true; END IF;
    IF req_states IS NOT NULL AND prof.state_of_residence IS NOT NULL AND NOT (prof.state_of_residence = ANY(req_states)) THEN reject := true; END IF;
    IF req_citizenship IS NOT NULL AND prof.citizenship_status IS NOT NULL AND lower(prof.citizenship_status) <> lower(req_citizenship) THEN reject := true; END IF;

    IF reject THEN CONTINUE; END IF;

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
    is_personal_discovery := false;
    RETURN NEXT;
  END LOOP;

  FOR cand IN
    SELECT sc2.* FROM public.scholarship_candidates sc2
    WHERE sc2.discovered_for_user_id = _user_id
      AND sc2.status = 'pending'
      AND (sc2.deadline IS NULL OR sc2.deadline >= CURRENT_DATE)
    ORDER BY sc2.relevance_score DESC NULLS LAST, sc2.deadline ASC NULLS LAST
  LOOP
    id := cand.id;
    name := cand.name;
    sponsor := cand.sponsor;
    amount_cents := cand.amount_cents;
    deadline := cand.deadline;
    description := cand.description;
    eligibility_criteria := cand.eligibility_criteria;
    essay_prompts := cand.essay_prompts;
    external_url := cand.external_url;
    active := true;
    created_at := cand.created_at;
    updated_at := cand.created_at;
    match_score := 75;
    match_reasons := ARRAY['AI-discovered for your profile'];
    is_personal_discovery := true;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$function$;
