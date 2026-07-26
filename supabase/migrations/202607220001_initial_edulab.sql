create extension if not exists vector;
create extension if not exists pgcrypto;

do $$ begin
  create type user_role as enum ('student', 'teacher', 'parent', 'admin');
exception when duplicate_object then null; end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  level text, grade text, cycle text, difficult_subjects text, goals text,
  preferred_language text default 'Français', learning_style text,
  exam_class boolean default false, onboarding_completed boolean default false,
  updated_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(), key text not null unique,
  level text not null, subject text not null, chapter text not null, lesson text not null,
  skill text, title text not null, summary text not null, content jsonb not null,
  source text not null, validated boolean not null default false,
  created_at timestamptz default now()
);
create table if not exists progress (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  status text not null default 'not_started', mastery real not null default 0,
  score integer, last_accessed_at timestamptz, unique(user_id, course_id)
);
create table if not exists experiments (
  id uuid primary key default gen_random_uuid(), key text not null unique,
  subject text not null, lesson text not null, title text not null, summary text not null, icon text
);
create table if not exists exercise_attempts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  scope text not null, subject text, statement text not null, attempt text,
  hints_used integer not null default 0, correct boolean, time_spent_sec integer not null default 0,
  created_at timestamptz default now()
);
create table if not exists exam_papers (
  id uuid primary key default gen_random_uuid(), key text not null unique,
  exam text not null, year text not null, subject text not null, chapter text,
  difficulty text not null default 'moyen', title text not null, questions jsonb not null,
  source text not null
);
create table if not exists activities (
  id uuid primary key default gen_random_uuid(), user_hash text not null,
  origin text not null default 'synthetic', activity_type text not null,
  subject text, mastery real, meta jsonb, created_at timestamptz default now()
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, base_url text not null, owner text not null,
  source_type text not null, official_status text not null,
  allowed_ingestion_mode text not null default 'manual',
  requires_manual_download boolean not null default true,
  terms_review_status text not null default 'pending',
  last_checked_at timestamptz, notes text, created_at timestamptz not null default now()
);

create table if not exists knowledge_documents (
  id uuid primary key default gen_random_uuid(), source_id uuid references sources(id),
  title text not null, source_url text, document_type text not null,
  academic_class text not null, subject text not null, year integer, language text default 'fr',
  official_status text not null, validation_status text not null default 'pending',
  content_hash text not null unique, storage_path text, metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references knowledge_documents(id) on delete cascade,
  chunk_index integer not null, content text not null, page_number integer,
  competency text, chapter text, lesson text, embedding vector(768),
  metadata jsonb not null default '{}', unique(document_id, chunk_index)
);
create index if not exists knowledge_chunks_embedding_idx on knowledge_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table users enable row level security;
alter table profiles enable row level security;
alter table sources enable row level security;
alter table knowledge_documents enable row level security;
alter table knowledge_chunks enable row level security;

create policy "own user row" on users for select using (auth.uid() = id);
create policy "own profile" on profiles for select using (auth.uid() = user_id);
create policy "update own profile" on profiles for update using (auth.uid() = user_id);
