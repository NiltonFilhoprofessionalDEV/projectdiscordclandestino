-- Owner/admin can add an accepted friend directly into a community.
create or replace function public.invite_friend_to_community(
  target_community uuid,
  friend_user uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  are_friends boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if friend_user = auth.uid() then
    raise exception 'Você não pode convidar a si mesmo' using errcode = '23514';
  end if;

  if not public.can_manage_community(target_community) then
    raise exception 'Sem permissão para convidar' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.friendships
    where status = 'accepted'
      and (
        (requester_id = auth.uid() and addressee_id = friend_user)
        or (requester_id = friend_user and addressee_id = auth.uid())
      )
  ) into are_friends;

  if not are_friends then
    raise exception 'Só é possível convidar amigos' using errcode = '42501';
  end if;

  insert into public.community_members (community_id, user_id, role)
  values (target_community, friend_user, 'member')
  on conflict (community_id, user_id) do nothing;

  return target_community;
end;
$$;

revoke all on function public.invite_friend_to_community(uuid, uuid) from public;
grant execute on function public.invite_friend_to_community(uuid, uuid) to authenticated;
