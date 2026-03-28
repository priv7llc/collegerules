
-- Allow users to insert dashboards for their own routes
CREATE POLICY "Users can insert own dashboards" ON public.route_dashboards FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.routes WHERE routes.id = route_dashboards.route_id AND routes.user_id = auth.uid()));

-- Allow users to update credits they own
CREATE POLICY "Users can update own credits" ON public.route_credits FOR UPDATE
  USING (auth.uid() = user_id);
