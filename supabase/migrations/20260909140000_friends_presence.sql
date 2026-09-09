alter table public.profiles
  add column if not exists presence text not null default 'offline'
    check (presence in ('offline', 'online', 'in_voice')),
  add column if not exists activity text,
  add column if not exists last_seen_at timestamptz;

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create index if not exists friendships_requester_idx on public.friendships(requester_id);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id);

alter table public.friendships enable row level security;

create policy "users read own friendships"
  on public.friendships for select
  to authenticated
  using (
    requester_id = (select auth.uid())
    or addressee_id = (select auth.uid())
  );

create policy "users create friend requests"
  on public.friendships for insert
  to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
  );

create policy "addressee update friend requests"
  on public.friendships for update
  to authenticated
  using (addressee_id = (select auth.uid()))
  with check (addressee_id = (select auth.uid()));

create policy "users delete own friendships"
  on public.friendships for delete
  to authenticated
  using (
    requester_id = (select auth.uid())
    or addressee_id = (select auth.uid())
  );

create or replace function public.request_friend_by_email(friend_email text)
returns public.friendships
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  created public.friendships;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select id into target_id
  from auth.users
  where lower(email) = lower(trim(friend_email))
  limit 1;

  if target_id is null then
    raise exception 'Usuário não encontrado' using errcode = 'P0002';
  end if;

  if target_id = auth.uid() then
    raise exception 'Você não pode adicionar a si mesmo' using errcode = '23514';
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (auth.uid(), target_id, 'pending')
  on conflict (requester_id, addressee_id) do update
    set status = excluded.status
  returning * into created;

  return created;
end;
$$;

revoke all on function public.request_friend_by_email(text) from public;
grant execute on function public.request_friend_by_email(text) to authenticated;

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

  return updated;
end;
$$;

revoke all on function public.set_my_presence(text, text) from public;
grant execute on function public.set_my_presence(text, text) to authenticated;

create policy "authenticated users update own presence"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
