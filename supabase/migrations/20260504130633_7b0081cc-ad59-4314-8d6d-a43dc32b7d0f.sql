
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Resorts
CREATE TABLE public.resorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resorts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resorts public read" ON public.resorts FOR SELECT USING (true);
CREATE POLICY "Owners insert resorts" ON public.resorts FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update resorts" ON public.resorts FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners delete resorts" ON public.resorts FOR DELETE USING (auth.uid() = owner_id);

-- Parks
CREATE TABLE public.parks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resort_id UUID NOT NULL REFERENCES public.resorts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  map_image_url TEXT,
  -- opening_hours: { "mon": {"open":"09:00","close":"18:00","closed":false}, ... }
  opening_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parks public read" ON public.parks FOR SELECT USING (true);
CREATE POLICY "Owners insert parks" ON public.parks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.resorts r WHERE r.id = resort_id AND r.owner_id = auth.uid())
);
CREATE POLICY "Owners update parks" ON public.parks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.resorts r WHERE r.id = resort_id AND r.owner_id = auth.uid())
);
CREATE POLICY "Owners delete parks" ON public.parks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.resorts r WHERE r.id = resort_id AND r.owner_id = auth.uid())
);

-- Item type enum
CREATE TYPE public.item_type AS ENUM ('attraction', 'food', 'other');
CREATE TYPE public.item_status AS ENUM ('open', 'closed', 'sync', 'custom');

-- Park items (attractions, food, other)
CREATE TABLE public.park_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id UUID NOT NULL REFERENCES public.parks(id) ON DELETE CASCADE,
  type public.item_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  important_info TEXT,
  photo_url TEXT,
  status public.item_status NOT NULL DEFAULT 'sync',
  custom_hours JSONB DEFAULT '{}'::jsonb,
  show_wait_time BOOLEAN NOT NULL DEFAULT false,
  wait_time TEXT, -- e.g. "5", "10", "90+"
  map_x NUMERIC, -- 0..1 relative coords
  map_y NUMERIC,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.park_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items public read" ON public.park_items FOR SELECT USING (true);
CREATE POLICY "Owners insert items" ON public.park_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.parks p JOIN public.resorts r ON r.id = p.resort_id
          WHERE p.id = park_id AND r.owner_id = auth.uid())
);
CREATE POLICY "Owners update items" ON public.park_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.parks p JOIN public.resorts r ON r.id = p.resort_id
          WHERE p.id = park_id AND r.owner_id = auth.uid())
);
CREATE POLICY "Owners delete items" ON public.park_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.parks p JOIN public.resorts r ON r.id = p.resort_id
          WHERE p.id = park_id AND r.owner_id = auth.uid())
);

-- Resort links (for "Mehr" tab as blocks)
CREATE TABLE public.resort_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resort_id UUID NOT NULL REFERENCES public.resorts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resort_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Links public read" ON public.resort_links FOR SELECT USING (true);
CREATE POLICY "Owners insert links" ON public.resort_links FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.resorts r WHERE r.id = resort_id AND r.owner_id = auth.uid())
);
CREATE POLICY "Owners update links" ON public.resort_links FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.resorts r WHERE r.id = resort_id AND r.owner_id = auth.uid())
);
CREATE POLICY "Owners delete links" ON public.resort_links FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.resorts r WHERE r.id = resort_id AND r.owner_id = auth.uid())
);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_resorts_touch BEFORE UPDATE ON public.resorts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_parks_touch BEFORE UPDATE ON public.parks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_items_touch BEFORE UPDATE ON public.park_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('park-assets', 'park-assets', true);

CREATE POLICY "Public read park-assets" ON storage.objects FOR SELECT USING (bucket_id = 'park-assets');
CREATE POLICY "Auth users upload park-assets" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'park-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth users update own park-assets" ON storage.objects FOR UPDATE
  USING (bucket_id = 'park-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth users delete own park-assets" ON storage.objects FOR DELETE
  USING (bucket_id = 'park-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
