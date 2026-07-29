-- 1. Categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'Palette',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing 6 categories
INSERT INTO public.categories (name, icon, sort_order) VALUES
  ('Paisagem', 'Mountain', 1),
  ('Retrato', 'User', 2),
  ('Anime', 'Sparkles', 3),
  ('Pintura', 'Palette', 4),
  ('Animais', 'PawPrint', 5),
  ('Estudo', 'BookOpen', 6)
ON CONFLICT (name) DO NOTHING;

-- 2. Featured flag on artworks
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- Only one featured per category
CREATE UNIQUE INDEX IF NOT EXISTS artworks_one_featured_per_categoria
  ON public.artworks (categoria) WHERE featured = true;
