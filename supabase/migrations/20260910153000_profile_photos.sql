alter table public.profiles
  add column if not exists photo_urls text[] not null default '{}';

alter table public.profiles
  drop constraint if exists profiles_photo_urls_len;

alter table public.profiles
  add constraint profiles_photo_urls_len check (cardinality(photo_urls) <= 8);
