-- Prism: full database setup.
--
-- The single source of truth for the schema. To rebuild from scratch, run
-- this whole file in the Supabase SQL editor on an empty project.
-- Whenever the live database changes, update this file in the same commit
-- as the code that needs the change.

-- Tracks. The table is still called "projects" from Prism's first version.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#c87941',
  created_at timestamptz default now(),
  -- unused: levels are one shared scale in code (src/lib/tiers.js).
  -- Kept so per-track levels can come back without a migration.
  tier1_min integer not null default 60,
  tier2_min integer not null default 120,
  tier3_min integer not null default 180,
  family text,
  priority integer, -- the user's ranking for tie-breaks; lower wins
  hide_on_share boolean not null default false,
  archived_at timestamptz,
  constraint projects_tiers_check
    check (tier1_min > 0 and tier1_min < tier2_min and tier2_min < tier3_min)
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  duration_minutes integer not null,
  -- legacy: hand-picked 1-4 from Prism's first version; tiers now come from hours
  intensity integer,
  note text,
  date date not null default current_date, -- the user's local day
  created_at timestamptz default now(),
  source text not null default 'manual', -- typed in, live timer, or AI
  constraint sessions_intensity_check check (intensity >= 1 and intensity <= 4),
  constraint sessions_source_check
    check (source in ('manual', 'timer', 'voice', 'text')),
  constraint sessions_duration_check
    check (duration_minutes > 0 and duration_minutes <= 1440)
);

create index if not exists sessions_user_date_idx
  on public.sessions (user_id, date);

-- Row-level security: every user sees and edits only their own rows.
alter table public.projects enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "Users can manage own projects" on public.projects;
create policy "Users can manage own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own sessions" on public.sessions;
create policy "Users can manage own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Safety net: any new table in public gets row-level security switched on
-- automatically. Runs as an event trigger only; not callable through the API.
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $$
declare
  cmd record;
begin
  for cmd in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name = 'public' then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception when others then
        raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    end if;
  end loop;
end;
$$;

drop event trigger if exists ensure_rls;
create event trigger ensure_rls on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function public.rls_auto_enable();
