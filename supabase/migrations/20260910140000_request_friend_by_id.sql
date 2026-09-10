create or replace function public.request_friend_by_id(friend_user uuid)
returns public.friendships
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.friendships;
  created public.friendships;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if friend_user is null then
    raise exception 'Usuário não encontrado' using errcode = 'P0002';
  end if;

  if friend_user = auth.uid() then
    raise exception 'Você não pode adicionar a si mesmo' using errcode = '23514';
  end if;

  if not exists (select 1 from public.profiles where id = friend_user) then
    raise exception 'Usuário não encontrado' using errcode = 'P0002';
  end if;

  select * into existing
  from public.friendships
  where (requester_id = auth.uid() and addressee_id = friend_user)
     or (requester_id = friend_user and addressee_id = auth.uid())
  order by case when status = 'accepted' then 0 else 1 end
  limit 1;

  if existing.id is not null then
    if existing.status = 'accepted' then
      raise exception 'Já são amigos' using errcode = '23505';
    end if;
    if existing.addressee_id = auth.uid() then
      raise exception 'Pedido já recebido' using errcode = '23505';
    end if;
    return existing;
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (auth.uid(), friend_user, 'pending')
  returning * into created;

  return created;
end;
$$;

revoke all on function public.request_friend_by_id(uuid) from public;
grant execute on function public.request_friend_by_id(uuid) to authenticated;
