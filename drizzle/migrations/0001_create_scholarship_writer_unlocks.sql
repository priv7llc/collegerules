CREATE TABLE public.scholarship_writer_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('month','three_month','lifetime')),
  expires_at timestamptz,
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX scholarship_writer_unlocks_user_idx ON public.scholarship_writer_unlocks(user_id);

GRANT SELECT ON public.scholarship_writer_unlocks TO authenticated;
GRANT ALL ON public.scholarship_writer_unlocks TO service_role;

ALTER TABLE public.scholarship_writer_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own writer unlocks"
  ON public.scholarship_writer_unlocks FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert writer unlocks"
  ON public.scholarship_writer_unlocks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update writer unlocks"
  ON public.scholarship_writer_unlocks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete writer unlocks"
  ON public.scholarship_writer_unlocks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.has_writer_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.scholarship_writer_unlocks
    WHERE user_id = _user_id
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.writer_access_summary(_user_id uuid)
RETURNS TABLE(active boolean, lifetime boolean, expires_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_writer_access(_user_id),
    EXISTS (SELECT 1 FROM public.scholarship_writer_unlocks u
            WHERE u.user_id = _user_id AND u.expires_at IS NULL),
    (SELECT MAX(u.expires_at) FROM public.scholarship_writer_unlocks u
      WHERE u.user_id = _user_id)
$$;