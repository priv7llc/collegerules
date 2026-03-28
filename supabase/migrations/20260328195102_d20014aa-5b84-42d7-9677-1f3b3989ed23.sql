
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create route_status enum
CREATE TYPE public.route_status AS ENUM ('draft', 'processing', 'ready', 'needs_review', 'archived');

-- Create purchase_status enum  
CREATE TYPE public.purchase_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ==================== PROFILES ====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== USER ROLES ====================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Auto-assign student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ==================== PRODUCTS ====================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  route_credits INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ==================== PURCHASES ====================
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  stripe_payment_id TEXT,
  product_code TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status purchase_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- ==================== ROUTE CREDITS ====================
CREATE TABLE public.route_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES public.purchases(id),
  credits_added INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.route_credits ENABLE ROW LEVEL SECURITY;

-- ==================== ROUTES ====================
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_name TEXT,
  community_college TEXT,
  major TEXT,
  destination_university TEXT,
  destination_program TEXT,
  catalog_year TEXT,
  transfer_term TEXT,
  status route_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON public.routes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== ROUTE INPUTS ====================
CREATE TABLE public.route_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  completed_courses JSONB DEFAULT '[]',
  in_progress_courses JSONB DEFAULT '[]',
  ap_ib_credits JSONB DEFAULT '[]',
  student_preferences JSONB DEFAULT '{}',
  gpa NUMERIC(4,2),
  raw_form_payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.route_inputs ENABLE ROW LEVEL SECURITY;

-- ==================== ROUTE DASHBOARDS ====================
CREATE TABLE public.route_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  dashboard_payload JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  generated_by TEXT DEFAULT 'mock',
  llm_model TEXT,
  needs_manual_review BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.route_dashboards ENABLE ROW LEVEL SECURITY;

-- ==================== CHECKLIST PROGRESS ====================
CREATE TABLE public.checklist_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(route_id, item_key)
);
ALTER TABLE public.checklist_progress ENABLE ROW LEVEL SECURITY;

-- ==================== COURSE PROGRESS ====================
CREATE TABLE public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  course_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  grade TEXT,
  term_taken TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(route_id, course_key)
);
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_course_progress_updated_at
  BEFORE UPDATE ON public.course_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== SOURCE COLLEGES ====================
CREATE TABLE public.source_colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name TEXT NOT NULL,
  state TEXT,
  system TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.source_colleges ENABLE ROW LEVEL SECURITY;

-- ==================== SOURCE MAJORS ====================
CREATE TABLE public.source_majors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID REFERENCES public.source_colleges(id) ON DELETE CASCADE,
  major_name TEXT NOT NULL,
  major_code TEXT,
  catalog_year TEXT,
  requirements_payload JSONB DEFAULT '{}',
  official_catalog_url TEXT,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.source_majors ENABLE ROW LEVEL SECURITY;

-- ==================== DESTINATION PROGRAMS ====================
CREATE TABLE public.destination_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  catalog_year TEXT,
  requirements_payload JSONB DEFAULT '{}',
  official_program_url TEXT,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.destination_programs ENABLE ROW LEVEL SECURITY;

-- ==================== ARTICULATION RULES ====================
CREATE TABLE public.articulation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_college_id UUID REFERENCES public.source_colleges(id) ON DELETE CASCADE,
  destination_program_id UUID REFERENCES public.destination_programs(id) ON DELETE CASCADE,
  major_name TEXT,
  catalog_year TEXT,
  rules_payload JSONB DEFAULT '{}',
  official_articulation_url TEXT,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.articulation_rules ENABLE ROW LEVEL SECURITY;

-- ==================== ADMIN AUDIT LOGS ====================
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ==================== RLS POLICIES ====================

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Products (public read)
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Purchases
CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchases" ON public.purchases FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage purchases" ON public.purchases FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Route credits
CREATE POLICY "Users can view own credits" ON public.route_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all credits" ON public.route_credits FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage credits" ON public.route_credits FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Routes
CREATE POLICY "Users can view own routes" ON public.routes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own routes" ON public.routes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own routes" ON public.routes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own routes" ON public.routes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all routes" ON public.routes FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage routes" ON public.routes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Route inputs
CREATE POLICY "Users can view own route inputs" ON public.route_inputs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.routes WHERE routes.id = route_inputs.route_id AND routes.user_id = auth.uid()));
CREATE POLICY "Users can insert own route inputs" ON public.route_inputs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.routes WHERE routes.id = route_inputs.route_id AND routes.user_id = auth.uid()));
CREATE POLICY "Users can update own route inputs" ON public.route_inputs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.routes WHERE routes.id = route_inputs.route_id AND routes.user_id = auth.uid()));
CREATE POLICY "Admins can manage route inputs" ON public.route_inputs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Route dashboards
CREATE POLICY "Users can view own dashboards" ON public.route_dashboards FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.routes WHERE routes.id = route_dashboards.route_id AND routes.user_id = auth.uid()));
CREATE POLICY "Admins can manage dashboards" ON public.route_dashboards FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Checklist progress
CREATE POLICY "Users can view own checklist" ON public.checklist_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.routes WHERE routes.id = checklist_progress.route_id AND routes.user_id = auth.uid()));
CREATE POLICY "Users can manage own checklist" ON public.checklist_progress FOR ALL
  USING (EXISTS (SELECT 1 FROM public.routes WHERE routes.id = checklist_progress.route_id AND routes.user_id = auth.uid()));
CREATE POLICY "Admins can manage checklist" ON public.checklist_progress FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Course progress
CREATE POLICY "Users can view own course progress" ON public.course_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.routes WHERE routes.id = course_progress.route_id AND routes.user_id = auth.uid()));
CREATE POLICY "Users can manage own course progress" ON public.course_progress FOR ALL
  USING (EXISTS (SELECT 1 FROM public.routes WHERE routes.id = course_progress.route_id AND routes.user_id = auth.uid()));
CREATE POLICY "Admins can manage course progress" ON public.course_progress FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Source data
CREATE POLICY "Anyone can view source colleges" ON public.source_colleges FOR SELECT USING (true);
CREATE POLICY "Admins can manage source colleges" ON public.source_colleges FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view source majors" ON public.source_majors FOR SELECT USING (true);
CREATE POLICY "Admins can manage source majors" ON public.source_majors FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view destination programs" ON public.destination_programs FOR SELECT USING (true);
CREATE POLICY "Admins can manage destination programs" ON public.destination_programs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view articulation rules" ON public.articulation_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage articulation rules" ON public.articulation_rules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Admin audit logs
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==================== HELPER FUNCTION ====================
CREATE OR REPLACE FUNCTION public.get_remaining_credits(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(credits_added - credits_used), 0)::INTEGER
  FROM public.route_credits
  WHERE user_id = _user_id
$$;

-- ==================== SEED PRODUCTS ====================
INSERT INTO public.products (code, name, price_cents, route_credits) VALUES
  ('single_route', '1 Transfer Route', 1000, 1),
  ('five_route_pack', '5 Transfer Routes', 2500, 5);
