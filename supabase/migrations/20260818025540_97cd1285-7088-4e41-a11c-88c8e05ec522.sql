INSERT INTO public.categories (name, icon, sort_order) VALUES
  ('Abstrato', 'Sparkles', 7),
  ('Figurativo', 'User', 8),
  ('Natureza', 'Trees', 9),
  ('Natureza-Morta', 'Flower', 10),
  ('Urbano', 'Mountain', 11),
  ('Contemporâneo', 'Zap', 12),
  ('Expressionismo', 'Flame', 13),
  ('Experimental / Técnica Mista', 'Ghost', 14)
ON CONFLICT (name) DO NOTHING;

UPDATE public.categories SET name = 'Paisagens' WHERE name = 'Paisagem';
UPDATE public.categories SET name = 'Retratos' WHERE name = 'Retrato';
UPDATE public.artworks SET categoria = 'Paisagens' WHERE categoria = 'Paisagem';
UPDATE public.artworks SET categoria = 'Retratos' WHERE categoria = 'Retrato';