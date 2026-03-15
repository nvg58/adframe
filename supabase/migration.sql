-- Adframe Database Migration
-- Run this in Supabase SQL Editor

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Inbox items
CREATE TABLE IF NOT EXISTS public.inbox_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  source_url text,
  source_author text,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Translations cache
CREATE TABLE IF NOT EXISTS public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_item_id uuid REFERENCES public.inbox_items(id) ON DELETE CASCADE NOT NULL,
  paragraph_hash text NOT NULL,
  original_text text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(inbox_item_id, paragraph_hash)
);

-- Swipe items
CREATE TABLE IF NOT EXISTS public.swipe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text,
  ad_type text NOT NULL CHECK (ad_type IN ('image', 'video', 'text', 'url')),
  content_text text,
  content_url text,
  image_path text,
  platform text NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'google', 'instagram', 'youtube', 'other')),
  category text NOT NULL CHECK (category IN ('hook', 'cta', 'visual', 'offer', 'other')),
  tags text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ad Tests
CREATE TABLE IF NOT EXISTS public.ad_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  inbox_item_id uuid REFERENCES public.inbox_items(id) ON DELETE SET NULL,
  test_number int,
  launch_date date,
  creative_type text,
  test_type text,
  landing_page text,
  ad_inspiration text,
  variable_testing text,
  problem_pain_point text,
  mass_desire text,
  avatar text,
  angle text,
  ump text,
  ums text,
  lead_type text,
  awareness_level text,
  hypothesis text NOT NULL,
  num_variations int DEFAULT 1,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'launched', 'done')),
  results text,
  learnings_winner text,
  learnings_loser text,
  next_hypothesis text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can CRUD own profiles" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can CRUD own inbox" ON public.inbox_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own translations" ON public.translations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.inbox_items WHERE id = inbox_item_id AND user_id = auth.uid())
);
CREATE POLICY "Users can CRUD own swipe items" ON public.swipe_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own ad_tests" ON public.ad_tests FOR ALL USING (auth.uid() = user_id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
