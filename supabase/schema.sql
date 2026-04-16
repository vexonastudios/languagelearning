-- Spanish Learning App — Full Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- LESSONS
-- ============================================================
create table if not exists lessons (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  "order" int not null default 0,
  category text not null default 'Basics',
  difficulty int not null default 1 check (difficulty between 1 and 5),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  audio_ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- VOCABULARY ITEMS
-- ============================================================
create table if not exists vocabulary_items (
  id uuid primary key default uuid_generate_v4(),
  english_text text not null,
  spanish_text text not null,
  lesson_id uuid references lessons(id) on delete cascade,
  category text not null default 'General',
  image_url text,
  example_en text,
  example_es text,
  tags text[] not null default '{}',
  difficulty int not null default 1 check (difficulty between 1 and 5),
  distractors_en text[] not null default '{}',
  distractors_es text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SENTENCES
-- ============================================================
create table if not exists sentences (
  id uuid primary key default uuid_generate_v4(),
  english_text text not null,
  spanish_text text not null,
  lesson_id uuid references lessons(id) on delete cascade,
  category text not null default 'General',
  grammar_focus text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- AUDIO CACHE
-- ============================================================
create table if not exists audio_cache (
  id uuid primary key default uuid_generate_v4(),
  cache_key text unique not null,
  raw_text text not null,
  normalized_text text not null,
  language text not null check (language in ('en', 'es')),
  voice_id text not null,
  file_url text,
  duration_ms int,
  status text not null default 'pending' check (status in ('pending', 'ready', 'error')),
  error_message text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists idx_audio_cache_key on audio_cache(cache_key);
create index if not exists idx_audio_cache_status on audio_cache(status);

-- ============================================================
-- USERS (child profiles)
-- ============================================================
create table if not exists child_profiles (
  id uuid primary key default uuid_generate_v4(),
  child_name text not null,
  age int,
  avatar text not null default '🦁',
  pin text,
  current_level int not null default 1,
  streak int not null default 0,
  total_xp int not null default 0,
  last_active_at timestamptz,
  parent_session_key text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- USER PROGRESS
-- ============================================================
create table if not exists user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references child_profiles(id) on delete cascade,
  item_id uuid not null,
  item_type text not null check (item_type in ('vocabulary', 'sentence')),
  mastery_level int not null default 0 check (mastery_level between 0 and 5),
  score int not null default 0,
  attempts int not null default 0,
  last_seen_at timestamptz,
  next_review_at timestamptz,
  unique(user_id, item_id, item_type)
);

create index if not exists idx_progress_user on user_progress(user_id);
create index if not exists idx_progress_review on user_progress(user_id, next_review_at);

-- ============================================================
-- LESSON SESSIONS
-- ============================================================
create table if not exists lesson_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references child_profiles(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  accuracy float check (accuracy between 0 and 1),
  xp_earned int not null default 0,
  questions_total int not null default 0,
  questions_correct int not null default 0
);

-- ============================================================
-- ROW LEVEL SECURITY (basic open for admin use — tighten later)
-- ============================================================
alter table lessons enable row level security;
alter table vocabulary_items enable row level security;
alter table sentences enable row level security;
alter table audio_cache enable row level security;
alter table child_profiles enable row level security;
alter table user_progress enable row level security;
alter table lesson_sessions enable row level security;

-- Service role can do everything (used by API routes)
create policy "service_role_all_lessons" on lessons for all using (true);
create policy "service_role_all_vocab" on vocabulary_items for all using (true);
create policy "service_role_all_sentences" on sentences for all using (true);
create policy "service_role_all_audio" on audio_cache for all using (true);
create policy "service_role_all_profiles" on child_profiles for all using (true);
create policy "service_role_all_progress" on user_progress for all using (true);
create policy "service_role_all_sessions" on lesson_sessions for all using (true);

-- Anon can read published lessons and vocab
create policy "anon_read_published_lessons" on lessons for select using (status = 'published');
create policy "anon_read_vocab" on vocabulary_items for select using (true);
create policy "anon_read_sentences" on sentences for select using (true);
create policy "anon_read_audio" on audio_cache for select using (status = 'ready');
