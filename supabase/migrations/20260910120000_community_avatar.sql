-- Community profile image + storage paths under avatars/community/<id>/
-- IMPORTANT: always qualify storage.objects.name — inside EXISTS ... FROM communities,
-- bare `name` resolves to communities.name and breaks the policy.
alter table public.communities
  add column if not exists avatar_url text;

drop policy if exists "Owners upload community avatar" on storage.objects;
create policy "Owners upload community avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(objects.name))[1] = 'community'
    and exists (
      select 1
      from public.communities c
      where c.id::text = (storage.foldername(objects.name))[2]
        and c.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners update community avatar" on storage.objects;
create policy "Owners update community avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(objects.name))[1] = 'community'
    and exists (
      select 1
      from public.communities c
      where c.id::text = (storage.foldername(objects.name))[2]
        and c.owner_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(objects.name))[1] = 'community'
    and exists (
      select 1
      from public.communities c
      where c.id::text = (storage.foldername(objects.name))[2]
        and c.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners delete community avatar" on storage.objects;
create policy "Owners delete community avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(objects.name))[1] = 'community'
    and exists (
      select 1
      from public.communities c
      where c.id::text = (storage.foldername(objects.name))[2]
        and c.owner_id = (select auth.uid())
    )
  );
