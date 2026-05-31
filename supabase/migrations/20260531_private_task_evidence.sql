-- Keep pharmacy IT photos and related evidence behind authenticated Storage access.
insert into storage.buckets (id, name, public)
values ('task-evidence', 'task-evidence', false)
on conflict (id) do update set public = false;

drop policy if exists "authenticated users can read task evidence" on storage.objects;
create policy "authenticated users can read task evidence"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'task-evidence');
