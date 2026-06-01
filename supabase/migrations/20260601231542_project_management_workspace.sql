-- Project management workspace: portfolio, operational pipelines, milestones
-- and communications. Incidents remain first-class records and can be linked
-- to both a project and a task for the future customer support portal.

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'projects'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%project_type%'
  loop
    execute format('alter table public.projects drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.projects
  add constraint projects_project_type_check
  check (project_type in ('commercial', 'support', 'training', 'installation'));

alter table public.projects
  add column if not exists notes text,
  add column if not exists visible_to_client boolean default false,
  add column if not exists description text,
  add column if not exists priority text default 'medium',
  add column if not exists progress smallint default 0,
  add column if not exists end_date date,
  add column if not exists external_contact text,
  add column if not exists external_email text,
  add column if not exists tags text[] default '{}',
  add column if not exists last_activity_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'projects_priority_check'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_priority_check
      check (priority in ('low', 'medium', 'high', 'critical'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'projects_progress_check'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_progress_check
      check (progress between 0 and 100);
  end if;
end $$;

alter table public.tasks
  add column if not exists assigned_technician_id uuid references public.profiles(id),
  add column if not exists required boolean default false,
  add column if not exists template_id uuid,
  add column if not exists priority text default 'medium',
  add column if not exists start_date date,
  add column if not exists position integer default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_priority_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_priority_check
      check (priority in ('low', 'medium', 'high', 'critical'));
  end if;
end $$;

alter table public.incidents
  add column if not exists assigned_technician_id uuid references public.profiles(id),
  add column if not exists resolution text,
  add column if not exists visible_to_client boolean default false,
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists source text default 'internal',
  add column if not exists linked_task_id uuid references public.tasks(id) on delete set null;

alter table public.activity_logs
  add column if not exists user_name text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'incidents_source_check'
      and conrelid = 'public.incidents'::regclass
  ) then
    alter table public.incidents
      add constraint incidents_source_check
      check (source in ('internal', 'customer_portal', 'email', 'phone'));
  end if;
end $$;

create table if not exists public.project_milestones (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  milestone_type text default 'milestone',
  status text default 'pending',
  start_at timestamptz,
  end_at timestamptz,
  notes text,
  visible_to_client boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint project_milestones_type_check
    check (milestone_type in ('milestone', 'meeting', 'delivery', 'training', 'installation', 'follow_up')),
  constraint project_milestones_status_check
    check (status in ('pending', 'in_progress', 'completed', 'cancelled'))
);

create table if not exists public.project_messages (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid references public.profiles(id),
  audience text default 'internal',
  channel text default 'note',
  subject text,
  message text not null,
  created_at timestamptz default now(),
  constraint project_messages_audience_check
    check (audience in ('internal', 'external')),
  constraint project_messages_channel_check
    check (channel in ('note', 'email', 'phone', 'meeting', 'portal'))
);

create index if not exists idx_projects_type_stage
  on public.projects(project_type, pipeline_stage);
create index if not exists idx_projects_expected_close_date
  on public.projects(expected_close_date);
create index if not exists idx_tasks_project_due_date
  on public.tasks(project_id, due_date);
create index if not exists idx_incidents_project_status
  on public.incidents(project_id, status);
create index if not exists idx_project_milestones_project_start
  on public.project_milestones(project_id, start_at);
create index if not exists idx_project_messages_project_created
  on public.project_messages(project_id, created_at desc);

alter table public.project_milestones enable row level security;
alter table public.project_messages enable row level security;

drop policy if exists "project_milestones_all" on public.project_milestones;
create policy "project_milestones_all" on public.project_milestones
  for all
  using (company_id = public.get_my_company_id())
  with check (company_id = public.get_my_company_id());

drop policy if exists "project_messages_all" on public.project_messages;
create policy "project_messages_all" on public.project_messages
  for all
  using (company_id = public.get_my_company_id())
  with check (company_id = public.get_my_company_id());

grant select, insert, update, delete on public.project_milestones to authenticated;
grant select, insert, update, delete on public.project_messages to authenticated;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_project_milestones on public.project_milestones;
create trigger set_updated_at_project_milestones
  before update on public.project_milestones
  for each row execute function public.update_updated_at();
