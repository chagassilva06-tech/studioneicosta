
-- Roles enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Security-definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
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

-- Auto-grant admin to the designated email on signup
CREATE OR REPLACE FUNCTION public.grant_admin_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'costa.sidnei@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_grant_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_admin_on_signup();

-- Tighten artworks policies: public read, admin-only writes
DROP POLICY IF EXISTS "Public insert artworks" ON public.artworks;
DROP POLICY IF EXISTS "Public update artworks" ON public.artworks;
DROP POLICY IF EXISTS "Public delete artworks" ON public.artworks;

CREATE POLICY "Admins can insert artworks"
  ON public.artworks FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update artworks"
  ON public.artworks FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete artworks"
  ON public.artworks FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tighten storage policies for the artworks bucket
DROP POLICY IF EXISTS "Public insert artworks bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public update artworks bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public delete artworks bucket" ON storage.objects;

CREATE POLICY "Admins can upload to artworks bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'artworks' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update artworks bucket"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'artworks' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'artworks' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete from artworks bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'artworks' AND public.has_role(auth.uid(), 'admin'));
