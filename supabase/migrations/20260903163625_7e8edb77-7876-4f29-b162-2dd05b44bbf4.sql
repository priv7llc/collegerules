INSERT INTO public.source_colleges (college_name, state, system, active) VALUES
  ('Houston City College', 'Texas', 'Texas Community College', true),
  ('Houston Community College', 'Texas', 'Texas Community College', true),
  ('Lone Star College', 'Texas', 'Texas Community College', true),
  ('San Jacinto College', 'Texas', 'Texas Community College', true),
  ('Austin Community College', 'Texas', 'Texas Community College', true),
  ('Dallas College', 'Texas', 'Texas Community College', true),
  ('Tarrant County College', 'Texas', 'Texas Community College', true),
  ('Alamo Colleges District', 'Texas', 'Texas Community College', true),
  ('Collin College', 'Texas', 'Texas Community College', true),
  ('El Paso Community College', 'Texas', 'Texas Community College', true),
  ('Blinn College', 'Texas', 'Texas Community College', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.university_costs
  (university_name, system, in_state, tuition_cents, housing_food_cents, books_supplies_cents, transportation_cents, personal_misc_cents, total_cost_cents, catalog_year, last_verified_at)
VALUES
  ('University of Houston', 'Texas Public', true, 1120000, 1150000, 120000, 250000, 200000, 2840000, '2025-2026', now()),
  ('University of Houston–Downtown', 'Texas Public', true, 830000, 1100000, 120000, 280000, 200000, 2530000, '2025-2026', now()),
  ('University of Houston–Clear Lake', 'Texas Public', true, 880000, 1080000, 120000, 270000, 200000, 2550000, '2025-2026', now()),
  ('Texas Southern University', 'Texas Public', true, 950000, 1060000, 130000, 260000, 200000, 2600000, '2025-2026', now()),
  ('Prairie View A&M University', 'Texas Public', true, 1010000, 1100000, 130000, 250000, 200000, 2690000, '2025-2026', now()),
  ('Sam Houston State University', 'Texas Public', true, 1050000, 1020000, 120000, 240000, 200000, 2630000, '2025-2026', now()),
  ('Texas A&M University', 'Texas Public', true, 1330000, 1230000, 120000, 240000, 220000, 3140000, '2025-2026', now()),
  ('Texas State University', 'Texas Public', true, 1220000, 1150000, 120000, 250000, 220000, 2960000, '2025-2026', now()),
  ('Texas Tech University', 'Texas Public', true, 1200000, 1130000, 120000, 250000, 220000, 2920000, '2025-2026', now()),
  ('The University of Texas at Austin', 'Texas Public', true, 1160000, 1400000, 120000, 220000, 240000, 3140000, '2025-2026', now()),
  ('The University of Texas at San Antonio', 'Texas Public', true, 970000, 1080000, 120000, 260000, 210000, 2640000, '2025-2026', now())
ON CONFLICT DO NOTHING;