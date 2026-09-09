begin;

create extension if not exists pgtap with schema extensions;

select plan(51);

select has_type('public', 'community_visibility', 'community_visibility enum exists');
select has_type('public', 'community_role', 'community_role enum exists');
select has_type('public', 'channel_type', 'channel_type enum exists');

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'communities', 'communities table exists');
select has_table('public', 'community_members', 'community_members table exists');
select has_table('public', 'channels', 'channels table exists');
select has_table('public', 'messages', 'messages table exists');
select has_table('public', 'invites', 'invites table exists');

select has_function('public', 'handle_new_user', 'handle_new_user function exists');
select has_function('public', 'create_community', 'create_community function exists');
select has_function('public', 'create_channel', 'create_channel function exists');
select has_function('public', 'accept_invite', 'accept_invite function exists');
select has_function('public', 'is_community_member', 'is_community_member function exists');
select has_function('public', 'can_manage_community', 'can_manage_community function exists');

create temporary table test_context (
  key text primary key,
  value uuid not null
);
grant select, insert, update on test_context to anon, authenticated;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'owner@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Owner User"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'second@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Second User"}',
    now(),
    now()
  );

select is(
  (
    select count(*)
    from public.profiles
    where id in (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002'
    )
  ),
  2::bigint,
  'profile trigger creates both profiles'
);

select is(
  (
    select count(*)
    from public.communities
    where name = 'Salas'
      and slug = 'salas'
      and visibility = 'public'
  ),
  1::bigint,
  'local seed creates the public Salas community'
);

select is(
  (
    select count(*)
    from public.community_members
    join public.communities
      on communities.id = community_members.community_id
    where communities.slug = 'salas'
      and community_members.role = 'owner'
      and community_members.user_id = communities.owner_id
  ),
  1::bigint,
  'seeded Salas community has one aligned owner'
);

select is(
  (
    select count(*)
    from public.channels
    join public.communities
      on communities.id = channels.community_id
    where communities.slug = 'salas'
  ),
  3::bigint,
  'seeded Salas community has three default channels'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);

insert into test_context (key, value)
select 'public', id
from public.create_community('Public Community', 'public-community', 'public');

insert into test_context (key, value)
select 'private', id
from public.create_community('Private Community', 'private-community', 'private');

reset role;

with inserted_message as (
  insert into public.messages (channel_id, author_id, content, client_nonce)
  select
    channels.id,
    '00000000-0000-0000-0000-000000000001',
    'Private message',
    '10000000-0000-0000-0000-000000000001'
  from public.channels
  join test_context on test_context.value = channels.community_id
  where test_context.key = 'private'
    and channels.type = 'text'
    and channels.name = 'geral'
  returning id
)
insert into test_context (key, value)
select 'private-message', id from inserted_message;

insert into public.invites (
  community_id,
  created_by,
  token_hash,
  max_uses
)
select
  value,
  '00000000-0000-0000-0000-000000000001',
  'private-token-hash',
  2
from test_context
where key = 'private';

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select results_eq(
  $$select slug from public.communities order by slug$$,
  $$values ('public-community'::text), ('salas'::text)$$,
  'anonymous reads only public communities'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000002',
  true
);

select is(
  (
    select count(*)
    from public.channels
    where community_id = (select value from test_context where key = 'private')
  ),
  0::bigint,
  'non-member cannot read private channels'
);

select is(
  (
    select count(*)
    from public.messages
    where id = (select value from test_context where key = 'private-message')
  ),
  0::bigint,
  'non-member cannot read private messages'
);

select results_eq(
  $$select public.accept_invite('private-token-hash')$$,
  $$select value from test_context where key = 'private'$$,
  'valid invite returns its community'
);

reset role;

select is(
  (
    select count(*)
    from public.community_members
    where community_id = (select value from test_context where key = 'private')
      and user_id = '00000000-0000-0000-0000-000000000002'
  ),
  1::bigint,
  'accepting an invite adds membership exactly once'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000002',
  true
);
select public.accept_invite('private-token-hash');
reset role;

select is(
  (select use_count from public.invites where token_hash = 'private-token-hash'),
  1,
  'accepting an invite twice consumes only one use'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000002',
  true
);

select is(
  (
    select count(*)
    from public.channels
    where community_id = (select value from test_context where key = 'private')
  ),
  3::bigint,
  'member reads private community channels'
);

select is(
  (
    select count(*)
    from public.messages
    where id = (select value from test_context where key = 'private-message')
  ),
  1::bigint,
  'member reads private community messages'
);

select results_eq(
  $$
    with inserted as (
      insert into public.messages (channel_id, author_id, content, client_nonce)
      select
        channels.id,
        '00000000-0000-0000-0000-000000000002',
        'Member message',
        '10000000-0000-0000-0000-000000000002'
      from public.channels
      join test_context on test_context.value = channels.community_id
      where test_context.key = 'private'
        and channels.type = 'text'
        and channels.name = 'geral'
      returning 1
    )
    select count(*) from inserted
  $$,
  $$values (1::bigint)$$,
  'member posts to a text channel'
);

select throws_ok(
  $$
    update public.messages
    set channel_id = (
      select channels.id
      from public.channels
      join test_context on test_context.value = channels.community_id
      where test_context.key = 'private'
        and channels.type = 'voice'
    )
    where client_nonce = '10000000-0000-0000-0000-000000000002'
  $$,
  '23514',
  'Message channel_id, author_id, and client_nonce are immutable',
  'member cannot move a message to a voice channel'
);

update public.messages
set channel_id = (
  select channels.id
  from public.channels
  join test_context on test_context.value = channels.community_id
  where test_context.key = 'private'
    and channels.type = 'text'
    and channels.name = 'geral'
)
where client_nonce = '10000000-0000-0000-0000-000000000002';

select throws_ok(
  $$
    update public.messages
    set client_nonce = '10000000-0000-0000-0000-000000000099'
    where client_nonce = '10000000-0000-0000-0000-000000000002'
  $$,
  '23514',
  'Message channel_id, author_id, and client_nonce are immutable',
  'member cannot change a message client nonce'
);

update public.messages
set client_nonce = '10000000-0000-0000-0000-000000000002'
where client_nonce = '10000000-0000-0000-0000-000000000099';

select lives_ok(
  $$
    update public.messages
    set content = 'Edited by author', edited_at = now()
    where client_nonce = '10000000-0000-0000-0000-000000000002'
  $$,
  'author can edit mutable message fields'
);

select throws_ok(
  $$
    insert into public.messages (channel_id, author_id, content, client_nonce)
    select
      channels.id,
      '00000000-0000-0000-0000-000000000002',
      'Voice message',
      '10000000-0000-0000-0000-000000000003'
    from public.channels
    join test_context on test_context.value = channels.community_id
    where test_context.key = 'private'
      and channels.type = 'voice'
  $$,
  '42501',
  'new row violates row-level security policy for table "messages"',
  'member cannot post to a voice channel'
);

select throws_ok(
  $$
    insert into public.messages (channel_id, author_id, content, client_nonce)
    select
      channels.id,
      '00000000-0000-0000-0000-000000000001',
      'Forged author',
      '10000000-0000-0000-0000-000000000004'
    from public.channels
    join test_context on test_context.value = channels.community_id
    where test_context.key = 'private'
      and channels.type = 'text'
      and channels.name = 'geral'
  $$,
  '42501',
  'new row violates row-level security policy for table "messages"',
  'member cannot forge the message author'
);

select throws_ok(
  $$
    insert into public.channels (
      community_id,
      name,
      type,
      position,
      created_by
    )
    select
      value,
      'member-channel',
      'text',
      10,
      '00000000-0000-0000-0000-000000000002'
    from test_context
    where key = 'private'
  $$,
  '42501',
  'new row violates row-level security policy for table "channels"',
  'member cannot create channels'
);

reset role;

select is(
  (
    select count(*)
    from public.community_members
    where community_id = (select value from test_context where key = 'private')
      and role = 'owner'
  ),
  1::bigint,
  'create_community creates exactly one owner'
);

select is(
  (
    select count(*)
    from public.channels
    where community_id = (select value from test_context where key = 'private')
  ),
  3::bigint,
  'create_community creates three default channels'
);

select is(
  (
    select count(*)
    from public.channels voice
    join public.channels companion
      on companion.id = voice.companion_text_channel_id
    where voice.community_id = (select value from test_context where key = 'private')
      and voice.type = 'voice'
      and companion.type = 'text'
      and companion.community_id = voice.community_id
  ),
  1::bigint,
  'default voice channel references its companion text channel'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);

select public.create_channel(
  (select value from test_context where key = 'public'),
  'dev',
  'voice'
);

select is(
  (
    select count(*)
    from public.channels
    where community_id = (select value from test_context where key = 'public')
      and name = 'dev'
      and type = 'voice'
  ),
  1::bigint,
  'create_channel creates a voice channel'
);

select is(
  (
    select count(*)
    from public.channels voice
    join public.channels companion
      on companion.id = voice.companion_text_channel_id
    where voice.community_id = (select value from test_context where key = 'public')
      and voice.name = 'dev'
      and voice.type = 'voice'
      and companion.name = 'chat-dev'
      and companion.type = 'text'
  ),
  1::bigint,
  'create_channel voice insert is transactional with companion'
);

insert into public.channels (community_id, name, type, position, created_by)
select
  value,
  'chat-taken',
  'text',
  20,
  '00000000-0000-0000-0000-000000000001'
from test_context
where key = 'public';

select throws_ok(
  $$
    select public.create_channel(
      (select value from test_context where key = 'public'),
      'taken',
      'voice'
    )
  $$,
  '23505',
  NULL,
  'create_channel rolls back when companion name conflicts'
);

select is(
  (
    select count(*)
    from public.channels
    where community_id = (select value from test_context where key = 'public')
      and name = 'taken'
      and type = 'voice'
  ),
  0::bigint,
  'failed create_channel voice does not leave an orphan voice channel'
);

reset role;

update public.community_members
set role = 'admin'
where community_id = (select value from test_context where key = 'private')
  and user_id = '00000000-0000-0000-0000-000000000002';

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000002',
  true
);

select lives_ok(
  $$
    insert into public.channels (
      community_id,
      name,
      type,
      position,
      created_by
    )
    select
      value,
      'admin-channel',
      'text',
      10,
      '00000000-0000-0000-0000-000000000002'
    from test_context
    where key = 'private'
  $$,
  'admin creates channels'
);

select throws_ok(
  $$
    update public.messages
    set author_id = '00000000-0000-0000-0000-000000000001'
    where client_nonce = '10000000-0000-0000-0000-000000000002'
  $$,
  '23514',
  'Message channel_id, author_id, and client_nonce are immutable',
  'admin cannot change a message author'
);

select throws_ok(
  $$
    update public.messages
    set content = 'Rewritten by admin'
    where client_nonce = '10000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  'new row violates row-level security policy for table "messages"',
  'admin cannot rewrite another author message'
);

select results_eq(
  $$
    with changed as (
      update public.community_members
      set role = 'member'
      where community_id = (select value from test_context where key = 'private')
        and role = 'owner'
      returning 1
    )
    select count(*) from changed
  $$,
  $$values (0::bigint)$$,
  'admin cannot change owner'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);

select results_eq(
  $$
    with changed as (
      update public.community_members
      set role = 'member'
      where community_id = (select value from test_context where key = 'private')
        and user_id = '00000000-0000-0000-0000-000000000002'
      returning 1
    )
    select count(*) from changed
  $$,
  $$values (1::bigint)$$,
  'owner can manage member roles'
);

reset role;
set constraints all immediate;

select throws_ok(
  $$
    insert into public.channels (
      community_id,
      name,
      type,
      position,
      created_by
    )
    select
      value,
      'invalid-voice',
      'voice',
      50,
      '00000000-0000-0000-0000-000000000001'
    from test_context
    where key = 'private'
  $$,
  '23514',
  'Voice channel requires a companion text channel in the same community',
  'voice channel requires a companion'
);

select throws_ok(
  $$
    insert into public.channels (
      community_id,
      name,
      type,
      position,
      companion_text_channel_id,
      created_by
    )
    select
      private_context.value,
      'cross-community-voice',
      'voice',
      51,
      public_channel.id,
      '00000000-0000-0000-0000-000000000001'
    from test_context private_context
    cross join public.channels public_channel
    join test_context public_context
      on public_context.value = public_channel.community_id
    where private_context.key = 'private'
      and public_context.key = 'public'
      and public_channel.type = 'text'
      and public_channel.name = 'geral'
  $$,
  '23514',
  'Voice channel requires a companion text channel in the same community',
  'voice companion must belong to the same community'
);

select throws_ok(
  $$
    insert into public.channels (
      community_id,
      name,
      type,
      position,
      companion_text_channel_id,
      created_by
    )
    select
      value,
      'voice-as-companion',
      'voice',
      52,
      (
        select id
        from public.channels
        where community_id = test_context.value
          and type = 'voice'
      ),
      '00000000-0000-0000-0000-000000000001'
    from test_context
    where key = 'private'
  $$,
  '23514',
  'Voice channel requires a companion text channel in the same community',
  'voice companion must be a text channel'
);

select throws_ok(
  $$
    delete from public.community_members
    using public.communities
    where communities.id = community_members.community_id
      and communities.slug = 'salas'
      and community_members.role = 'owner'
  $$,
  '23514',
  'Community must have exactly one owner aligned with owner_id',
  'community owner membership cannot be removed'
);

select throws_ok(
  $$
    update public.communities
    set owner_id = '00000000-0000-0000-0000-000000000002'
    where id = (select value from test_context where key = 'public')
  $$,
  '23514',
  'Community must have exactly one owner aligned with owner_id',
  'community owner_id must match its owner membership'
);

select * from finish();

rollback;
