-- =========================================================================
-- AGY Fit • Supabase PostgreSQL Schema & Storage Setup
-- Run this script in your Supabase project's SQL Editor (Dashboard -> SQL Editor)
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE
create table if not exists public.users (
  id text primary key,
  email text unique not null,
  password_hash text,
  name text not null,
  avatar_url text,
  provider text default 'email',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. PROFILES & BIOMETRICS TABLE
create table if not exists public.profiles (
  user_id text primary key references public.users(id) on delete cascade,
  name text,
  age integer default 23,
  gender text default 'male',
  height_cm numeric default 175,
  weight_kg numeric default 70,
  target_weight_kg numeric default 68,
  goal text default 'recomp',
  activity_level text default 'moderately_active',
  daily_target_calories numeric default 2100,
  daily_target_protein numeric default 140,
  daily_target_carbs numeric default 220,
  daily_target_fat numeric default 60,
  daily_target_water numeric default 3000,
  daily_target_steps numeric default 10000,
  dietary_tags jsonb default '["🍗 Non-Veg"]'::jsonb,
  focus_areas jsonb default '["🛡️ Full Body Balance"]'::jsonb,
  goals jsonb default '["recomp"]'::jsonb,
  recalculate_targets boolean default false,
  is_configured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. MEALS TABLE
create table if not exists public.meals (
  id text primary key,
  user_id text references public.users(id) on delete cascade,
  date text not null, -- YYYY-MM-DD
  meal_type text not null, -- 'breakfast', 'lunch', 'dinner', 'snack'
  food_name text not null,
  calories numeric default 0,
  protein numeric default 0,
  carbs numeric default 0,
  fats numeric default 0,
  portion text default '1 serving',
  time text,
  photo_url text,
  is_ai_estimated boolean default false,
  created_at timestamptz default now()
);

-- 4. SAVED MEAL PLANS TABLE
create table if not exists public.meal_plans (
  id text primary key,
  user_id text references public.users(id) on delete cascade,
  date text not null,
  day_name text,
  plan_json jsonb not null,
  target_calories numeric,
  macro_targets_json jsonb,
  created_at timestamptz default now()
);

-- 5. WORKOUT EXERCISE LOGS TABLE
create table if not exists public.workouts (
  id text primary key,
  user_id text references public.users(id) on delete cascade,
  date text not null,
  exercise_name text not null,
  sets integer default 3,
  reps integer default 10,
  weight_kg numeric default 0,
  rest_seconds integer default 60,
  muscle_group text,
  is_completed boolean default false,
  created_at timestamptz default now()
);

-- 6. FASTRACK & SMARTWATCH LOGS TABLE
create table if not exists public.watch_logs (
  id text primary key,
  user_id text references public.users(id) on delete cascade,
  date text not null,
  steps numeric default 0,
  active_calories numeric default 0,
  avg_heart_rate numeric,
  sleep_hours numeric,
  battery_level numeric,
  source text default 'Health Connect',
  is_auto_synced boolean default true,
  last_auto_sync_at timestamptz,
  synced_at timestamptz default now(),
  constraint watch_logs_user_date_unique unique (user_id, date)
);

-- 7. PROGRESS & PHYSIQUE VAULT PHOTOS TABLE
create table if not exists public.vault_photos (
  id text primary key,
  user_id text references public.users(id) on delete cascade,
  date text not null,
  pose text default 'Front Relaxed',
  photo_url text not null,
  storage_path text,
  weight_kg numeric,
  notes text,
  tags jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 8. WATER LOGS TABLE
create table if not exists public.water_logs (
  id text primary key,
  user_id text references public.users(id) on delete cascade,
  date text not null,
  glasses numeric default 0,
  ml numeric default 0,
  updated_at timestamptz default now(),
  constraint water_logs_user_date_unique unique (user_id, date)
);

-- 9. WEIGHT LOGS TABLE
create table if not exists public.weight_logs (
  id text primary key,
  user_id text references public.users(id) on delete cascade,
  date text not null,
  weight_kg numeric not null,
  notes text,
  created_at timestamptz default now()
);

-- 10. INDEXES FOR LIGHTNING FAST QUERIES
create index if not exists idx_meals_user_date on public.meals(user_id, date);
create index if not exists idx_workouts_user_date on public.workouts(user_id, date);
create index if not exists idx_watch_logs_user_date on public.watch_logs(user_id, date);
create index if not exists idx_vault_photos_user on public.vault_photos(user_id, date);
create index if not exists idx_weight_logs_user on public.weight_logs(user_id, date);

-- 11. STORAGE BUCKET FOR PHYSIQUE & FOOD PHOTOS
insert into storage.buckets (id, name, public)
values ('physique_vault', 'physique_vault', true)
on conflict (id) do nothing;

-- Set up public read access for storage bucket photos
create policy "Public Access to Physique Photos"
  on storage.objects for select
  using ( bucket_id = 'physique_vault' );

create policy "Allow Authorized Uploads"
  on storage.objects for insert
  with check ( bucket_id = 'physique_vault' );
