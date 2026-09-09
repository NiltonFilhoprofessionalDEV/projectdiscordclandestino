create type public.community_visibility as enum ('public', 'private');
create type public.community_role as enum ('owner', 'admin', 'member');
create type public.channel_type as enum ('text', 'voice');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 32),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null check (char_length(name) between 2 and 48),
  slug text not null unique,
  visibility public.community_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.community_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 48),
  type public.channel_type not null,
  position integer not null check (position >= 0),
  companion_text_channel_id uuid references public.channels(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (community_id, type, name)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  content text not null check (char_length(content) between 1 and 500),
  client_nonce uuid not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  unique (author_id, client_nonce)
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  token_hash text not null unique,
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index community_members_user_id_idx
  on public.community_members(user_id);
create unique index community_members_one_owner_idx
  on public.community_members(community_id) where role = 'owner';
create index channels_community_position_idx
  on public.channels(community_id, type, position);
create index messages_channel_cursor_idx
  on public.messages(channel_id, created_at desc, id desc);
create index invites_community_id_idx
  on public.invites(community_id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
begin
  profile_name := trim(coalesce(
    new.raw_user_meta_data ->> 'display_name',
    split_part(coalesce(new.email, ''), '@', 1)
  ));
  if char_length(profile_name) not between 2 and 32 then
    profile_name := 'Usuário';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, profile_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_community_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from community_members
    where community_id = target
      and user_id = auth.uid()
  )
$$;

create function public.can_manage_community(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from community_members
    where community_id = target
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
$$;

create function public.create_community(
  name text,
  slug text,
  visibility public.community_visibility
)
returns public.communities
language plpgsql
security definer
set search_path = public
as $$
declare
  created_community public.communities;
  companion_channel_id uuid;
  voice_channel_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  insert into public.communities (owner_id, name, slug, visibility)
  values (auth.uid(), create_community.name, create_community.slug, create_community.visibility)
  returning * into created_community;

  insert into public.community_members (community_id, user_id, role)
  values (created_community.id, auth.uid(), 'owner');

  insert into public.channels (community_id, name, type, position, created_by)
  values (created_community.id, 'geral', 'text', 0, auth.uid());

  insert into public.channels (community_id, name, type, position, created_by)
  values (created_community.id, 'chat-geral', 'text', 1, auth.uid())
  returning id into companion_channel_id;

  insert into public.channels (community_id, name, type, position, created_by)
  values (created_community.id, 'Geral', 'voice', 0, auth.uid())
  returning id into voice_channel_id;

  update public.channels
  set companion_text_channel_id = companion_channel_id
  where id = voice_channel_id;

  return created_community;
end;
$$;

create function public.accept_invite(invite_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_invite public.invites;
  inserted_rows integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
  into selected_invite
  from public.invites
  where token_hash = invite_token_hash
  for update;

  if not found then
    raise exception 'Invite not found' using errcode = 'P0002';
  end if;
  if selected_invite.revoked_at is not null then
    raise exception 'Invite revoked' using errcode = 'P0001';
  end if;
  if selected_invite.expires_at is not null and selected_invite.expires_at <= now() then
    raise exception 'Invite expired' using errcode = 'P0001';
  end if;
  if selected_invite.max_uses is not null
     and selected_invite.use_count >= selected_invite.max_uses then
    raise exception 'Invite exhausted' using errcode = 'P0001';
  end if;

  insert into public.community_members (community_id, user_id, role)
  values (selected_invite.community_id, auth.uid(), 'member')
  on conflict (community_id, user_id) do nothing;
  get diagnostics inserted_rows = row_count;

  if inserted_rows = 1 then
    update public.invites
    set use_count = use_count + 1
    where id = selected_invite.id;
  end if;

  return selected_invite.community_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.invites enable row level security;

create policy "authenticated users read profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "public or member communities are readable"
  on public.communities for select
  to anon, authenticated
  using (
    visibility = 'public'
    or case
      when (select auth.uid()) is null then false
      else public.is_community_member(id)
    end
  );

create policy "owners update communities"
  on public.communities for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "owners delete communities"
  on public.communities for delete
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "members read memberships"
  on public.community_members for select
  to authenticated
  using (public.is_community_member(community_id));

create policy "owners update memberships"
  on public.community_members for update
  to authenticated
  using (
    exists (
      select 1
      from public.communities
      where communities.id = community_members.community_id
        and communities.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.communities
      where communities.id = community_members.community_id
        and communities.owner_id = (select auth.uid())
    )
  );

create policy "owners delete memberships"
  on public.community_members for delete
  to authenticated
  using (
    exists (
      select 1
      from public.communities
      where communities.id = community_members.community_id
        and communities.owner_id = (select auth.uid())
    )
  );

create policy "members read channels"
  on public.channels for select
  to authenticated
  using (public.is_community_member(community_id));

create policy "managers create channels"
  on public.channels for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and public.can_manage_community(community_id)
  );

create policy "managers update channels"
  on public.channels for update
  to authenticated
  using (public.can_manage_community(community_id))
  with check (public.can_manage_community(community_id));

create policy "managers delete channels"
  on public.channels for delete
  to authenticated
  using (public.can_manage_community(community_id));

create policy "members read messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.channels
      where channels.id = messages.channel_id
        and public.is_community_member(channels.community_id)
    )
  );

create policy "members post text messages"
  on public.messages for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.channels
      where channels.id = messages.channel_id
        and channels.type = 'text'
        and public.is_community_member(channels.community_id)
    )
  );

create policy "authors or managers update messages"
  on public.messages for update
  to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1
      from public.channels
      where channels.id = messages.channel_id
        and public.can_manage_community(channels.community_id)
    )
  )
  with check (
    author_id = (select auth.uid())
    or exists (
      select 1
      from public.channels
      where channels.id = messages.channel_id
        and public.can_manage_community(channels.community_id)
    )
  );

create policy "managers delete messages"
  on public.messages for delete
  to authenticated
  using (
    exists (
      select 1
      from public.channels
      where channels.id = messages.channel_id
        and public.can_manage_community(channels.community_id)
    )
  );

create policy "managers read invites"
  on public.invites for select
  to authenticated
  using (public.can_manage_community(community_id));

create policy "managers create invites"
  on public.invites for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and public.can_manage_community(community_id)
  );

create policy "managers update invites"
  on public.invites for update
  to authenticated
  using (public.can_manage_community(community_id))
  with check (public.can_manage_community(community_id));

create policy "managers delete invites"
  on public.invites for delete
  to authenticated
  using (public.can_manage_community(community_id));

revoke all on function public.handle_new_user() from public;
revoke all on function public.create_community(text, text, public.community_visibility) from public;
revoke all on function public.accept_invite(text) from public;
revoke all on function public.is_community_member(uuid) from public;
revoke all on function public.can_manage_community(uuid) from public;

grant execute on function public.create_community(text, text, public.community_visibility)
  to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.is_community_member(uuid) to authenticated;
grant execute on function public.can_manage_community(uuid) to authenticated;
