create function public.create_channel(
  community_id uuid,
  name text,
  type public.channel_type
)
returns public.channels
language plpgsql
security definer
set search_path = public
as $$
declare
  created_channel public.channels;
  companion_id uuid;
  text_position integer;
  voice_position integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.can_manage_community(create_channel.community_id) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  select coalesce(max(position), -1) + 1
  into text_position
  from public.channels
  where channels.community_id = create_channel.community_id
    and channels.type = 'text';

  select coalesce(max(position), -1) + 1
  into voice_position
  from public.channels
  where channels.community_id = create_channel.community_id
    and channels.type = 'voice';

  if create_channel.type = 'text' then
    insert into public.channels (community_id, name, type, position, created_by)
    values (
      create_channel.community_id,
      create_channel.name,
      'text',
      text_position,
      auth.uid()
    )
    returning * into created_channel;
    return created_channel;
  end if;

  insert into public.channels (community_id, name, type, position, created_by)
  values (
    create_channel.community_id,
    left('chat-' || create_channel.name, 48),
    'text',
    text_position,
    auth.uid()
  )
  returning id into companion_id;

  insert into public.channels (
    community_id,
    name,
    type,
    position,
    created_by,
    companion_text_channel_id
  )
  values (
    create_channel.community_id,
    create_channel.name,
    'voice',
    voice_position,
    auth.uid(),
    companion_id
  )
  returning * into created_channel;

  return created_channel;
end;
$$;

revoke all on function public.create_channel(uuid, text, public.channel_type) from public;
grant execute on function public.create_channel(uuid, text, public.channel_type) to authenticated;
