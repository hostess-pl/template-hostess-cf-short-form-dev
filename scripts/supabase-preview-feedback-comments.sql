-- Persistent preview feedback comments (separate from analytics tables)
create extension if not exists pgcrypto;

create table if not exists public.preview_feedback_comments (
  id uuid primary key default gen_random_uuid(),
  site_key text not null,
  page_path text not null,
  locale text not null check (locale in ('en', 'pl', 'es')),
  selector text not null,
  rel_x double precision not null check (rel_x >= 0 and rel_x <= 1),
  rel_y double precision not null check (rel_y >= 0 and rel_y <= 1),
  doc_x integer not null,
  doc_y integer not null,
  message text not null check (char_length(message) >= 3 and char_length(message) <= 2000),
  author_name text not null default '',
  status text not null default 'open' check (status in ('open', 'detached')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_preview_feedback_comments_lookup
  on public.preview_feedback_comments (site_key, page_path, locale, created_at desc);

create or replace function public.preview_feedback_comments_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_preview_feedback_comments_set_updated_at on public.preview_feedback_comments;
create trigger trg_preview_feedback_comments_set_updated_at
before update on public.preview_feedback_comments
for each row execute function public.preview_feedback_comments_set_updated_at();
