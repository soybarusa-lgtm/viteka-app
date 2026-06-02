-- Corporate documents live in a private bucket and are isolated by the
-- company UUID stored as the first folder of every object path.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update set public = false;

alter table public.documents enable row level security;
grant select, insert, update, delete on public.documents to authenticated;

drop policy if exists "company documents read" on storage.objects;
create policy "company documents read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

drop policy if exists "company documents upload" on storage.objects;
create policy "company documents upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

drop policy if exists "company documents update" on storage.objects;
create policy "company documents update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
  );

drop policy if exists "company documents delete" on storage.objects;
create policy "company documents delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.get_my_company_id()::text
  );
