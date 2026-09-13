CREATE TABLE public.route_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id uuid REFERENCES public.routes(id) ON DELETE CASCADE,
  unlock_type text NOT NULL CHECK (unlock_type IN ('single','five_pack','five_pack_redemption','unlimited','comp')),
  slots integer,
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX route_unlocks_user_idx ON public.route_unlocks(user_id);
CREATE INDEX route_unlocks_route_idx ON public.route_unlocks(route_id);
CREATE UNIQUE INDEX route_unlocks_user_route_idx ON public.route_unlocks(user_id, route_id) WHERE route_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.route_unlocks TO authenticated;
GRANT ALL ON public.route_unlocks TO service_role;

ALTER TABLE public.route_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own unlocks" ON public.route_unlocks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert unlocks" ON public.route_unlocks
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update unlocks" ON public.route_unlocks
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete unlocks" ON public.route_unlocks
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- available pack slots (granted minus redeemed)
CREATE OR REPLACE FUNCTION public.available_unlock_slots(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    COALESCE((SELECT SUM(slots) FROM public.route_unlocks
              WHERE user_id = _user_id AND route_id IS NULL AND unlock_type = 'five_pack'), 0)
    - COALESCE((SELECT COUNT(*) FROM public.route_unlocks
              WHERE user_id = _user_id AND unlock_type = 'five_pack_redemption'), 0),
  0)::integer
$$;

CREATE OR REPLACE FUNCTION public.has_unlimited_unlocks(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.route_unlocks
                 WHERE user_id = _user_id AND unlock_type = 'unlimited')
$$;

CREATE OR REPLACE FUNCTION public.is_route_unlocked(_user_id uuid, _route_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_unlimited_unlocks(_user_id)
     OR EXISTS (SELECT 1 FROM public.route_unlocks
                WHERE user_id = _user_id AND route_id = _route_id)
$$;

-- redeem an available five-pack slot against a route (called by the owner)
CREATE OR REPLACE FUNCTION public.redeem_unlock_slot(_route_id uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.routes WHERE id = _route_id AND user_id = _uid) THEN
    RETURN false;
  END IF;
  IF public.is_route_unlocked(_uid, _route_id) THEN RETURN true; END IF;
  IF public.available_unlock_slots(_uid) <= 0 THEN RETURN false; END IF;

  INSERT INTO public.route_unlocks (user_id, route_id, unlock_type)
  VALUES (_uid, _route_id, 'five_pack_redemption')
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

-- summary for the routes page pill
CREATE OR REPLACE FUNCTION public.unlock_summary(_user_id uuid)
RETURNS TABLE(unlimited boolean, used integer, available integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_unlimited_unlocks(_user_id),
    (SELECT COUNT(*) FROM public.route_unlocks
      WHERE user_id = _user_id AND route_id IS NOT NULL)::integer,
    public.available_unlock_slots(_user_id)
$$;