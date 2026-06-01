
-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  color_type text,
  body_type text,
  style_preferences text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Wardrobe items
CREATE TABLE public.wardrobe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  name text,
  type text NOT NULL,
  subtype text,
  color_primary text,
  color_secondary text,
  pattern text,
  season text[] DEFAULT '{}',
  formality text,
  style_vibe text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wardrobe_items TO authenticated;
GRANT ALL ON public.wardrobe_items TO service_role;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wi select" ON public.wardrobe_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own wi insert" ON public.wardrobe_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own wi update" ON public.wardrobe_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own wi delete" ON public.wardrobe_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Outfits
CREATE TABLE public.outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  occasion text,
  items uuid[] DEFAULT '{}',
  explanation text,
  weather text,
  mood text,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outfits TO authenticated;
GRANT ALL ON public.outfits TO service_role;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own o select" ON public.outfits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own o insert" ON public.outfits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own o update" ON public.outfits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own o delete" ON public.outfits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Outfit saves
CREATE TABLE public.outfit_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id uuid NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, outfit_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outfit_saves TO authenticated;
GRANT ALL ON public.outfit_saves TO service_role;
ALTER TABLE public.outfit_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own os select" ON public.outfit_saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own os insert" ON public.outfit_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own os delete" ON public.outfit_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for wardrobe photos
INSERT INTO storage.buckets (id, name, public) VALUES ('wardrobe-items', 'wardrobe-items', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "wi storage select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'wardrobe-items');
CREATE POLICY "wi storage insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'wardrobe-items' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "wi storage update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'wardrobe-items' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "wi storage delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'wardrobe-items' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
