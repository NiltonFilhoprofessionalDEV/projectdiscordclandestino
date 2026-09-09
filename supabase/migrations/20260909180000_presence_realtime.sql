-- Keep presence heartbeat reliable and expose profile presence over Realtime.
create or replace function public.set_my_presence(
  next_presence text,
  next_activity text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if next_presence not in ('offline', 'online', 'in_voice') then
    raise exception 'Presence inválida' using errcode = '23514';
  end if;

  update public.profiles
  set
    presence = next_presence,
    activity = next_activity,
    last_seen_at = now(),
    updated_at = now()
  where id = auth.uid()
  returning * into updated;

  if updated.id is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  return updated;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
