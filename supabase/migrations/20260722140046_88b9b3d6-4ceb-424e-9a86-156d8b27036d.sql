
CREATE TABLE public.artworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria text NOT NULL,
  slot integer NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (categoria, slot)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.artworks TO anon, authenticated;
GRANT ALL ON public.artworks TO service_role;

ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read artworks" ON public.artworks FOR SELECT USING (true);
CREATE POLICY "Public insert artworks" ON public.artworks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update artworks" ON public.artworks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete artworks" ON public.artworks FOR DELETE USING (true);

-- Storage policies for the private 'artworks' bucket: allow public read/write (matches current open UX).
CREATE POLICY "Public read artworks bucket" ON storage.objects FOR SELECT USING (bucket_id = 'artworks');
CREATE POLICY "Public insert artworks bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'artworks');
CREATE POLICY "Public update artworks bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'artworks') WITH CHECK (bucket_id = 'artworks');
CREATE POLICY "Public delete artworks bucket" ON storage.objects FOR DELETE USING (bucket_id = 'artworks');
