
CREATE TABLE public.university_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_name text NOT NULL,
  system text,
  in_state boolean NOT NULL DEFAULT true,
  tuition_cents integer NOT NULL,
  housing_food_cents integer,
  books_supplies_cents integer,
  transportation_cents integer,
  personal_misc_cents integer,
  total_cost_cents integer NOT NULL,
  catalog_year text DEFAULT '2025-2026',
  last_verified_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.university_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view university costs"
ON public.university_costs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage university costs"
ON public.university_costs FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_university_costs_name ON public.university_costs (lower(university_name));

ALTER TABLE public.scholarship_profiles
  ADD COLUMN IF NOT EXISTS expected_family_contribution_cents integer;

INSERT INTO public.university_costs
  (university_name, system, tuition_cents, housing_food_cents, books_supplies_cents, transportation_cents, personal_misc_cents, total_cost_cents)
VALUES
  -- CSU campuses
  ('San José State University', 'CSU', 850000, 1730000, 120000, 150000, 250000, 3100000),
  ('California State University Long Beach', 'CSU', 850000, 1630000, 120000, 150000, 250000, 3000000),
  ('California State University Los Angeles', 'CSU', 850000, 1430000, 120000, 150000, 250000, 2800000),
  ('San Diego State University', 'CSU', 850000, 1880000, 120000, 150000, 250000, 3250000),
  ('California State University Fullerton', 'CSU', 850000, 1480000, 120000, 150000, 250000, 2850000),
  ('California Polytechnic State University San Luis Obispo', 'CSU', 850000, 1830000, 120000, 150000, 250000, 3200000),
  ('California State University Sacramento', 'CSU', 850000, 1430000, 120000, 150000, 250000, 2800000),
  ('California State University Northridge', 'CSU', 850000, 1380000, 120000, 150000, 250000, 2750000),
  ('California State University East Bay', 'CSU', 850000, 1530000, 120000, 150000, 250000, 2900000),
  ('San Francisco State University', 'CSU', 850000, 1830000, 120000, 150000, 250000, 3200000),
  ('California State University Fresno', 'CSU', 850000, 1130000, 120000, 150000, 250000, 2500000),
  ('Sonoma State University', 'CSU', 850000, 1680000, 120000, 150000, 250000, 3050000),
  -- UC campuses
  ('University of California Berkeley', 'UC', 1600000, 2130000, 120000, 150000, 250000, 4250000),
  ('University of California Los Angeles', 'UC', 1600000, 2080000, 120000, 150000, 250000, 4200000),
  ('University of California San Diego', 'UC', 1600000, 1980000, 120000, 150000, 250000, 4100000),
  ('University of California Davis', 'UC', 1600000, 1980000, 120000, 150000, 250000, 4100000),
  ('University of California Irvine', 'UC', 1600000, 1930000, 120000, 150000, 250000, 4050000),
  ('University of California Santa Barbara', 'UC', 1600000, 1930000, 120000, 150000, 250000, 4050000),
  ('University of California Riverside', 'UC', 1600000, 1730000, 120000, 150000, 250000, 3850000),
  ('University of California Santa Cruz', 'UC', 1600000, 1880000, 120000, 150000, 250000, 4000000),
  ('University of California Merced', 'UC', 1600000, 1530000, 120000, 150000, 250000, 3650000),
  -- System averages
  ('CSU System', 'CSU', 850000, 1630000, 120000, 150000, 250000, 3000000),
  ('UC System', 'UC', 1600000, 1880000, 120000, 150000, 250000, 4000000);
