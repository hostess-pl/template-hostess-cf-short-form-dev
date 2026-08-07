-- Region annotation support for preview feedback comments
alter table public.preview_feedback_comments
  add column if not exists annotation_type text not null default 'point'
    check (annotation_type in ('point', 'region')),
  add column if not exists rel_w double precision
    check (rel_w is null or (rel_w >= 0 and rel_w <= 1)),
  add column if not exists rel_h double precision
    check (rel_h is null or (rel_h >= 0 and rel_h <= 1));
