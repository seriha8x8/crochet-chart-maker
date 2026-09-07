-- Crochet Chart Maker schema.
-- Prefixed with chart_ to avoid colliding with other apps sharing this Supabase project.

create table if not exists chart_projects (
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My Chart',
  guide jsonb not null default '{
    "type": "chain",
    "chain": { "y": 420, "startX": 80, "length": 500, "stitchSpacing": 20 },
    "ring": { "centerX": 400, "centerY": 300, "ringCount": 4, "ringSpacing": 34 }
  }'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists chart_layers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  visible boolean not null default true,
  "order" integer not null default 0
);

create table if not exists chart_symbols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  x double precision not null,
  y double precision not null,
  rotation double precision not null default 0,
  layer_id uuid not null references chart_layers (id) on delete cascade,
  parent_ids uuid[] not null default '{}',
  attach_type text not null default 'stitch',
  color text,
  loop_count integer not null default 3,
  base_stitch text not null default 'double'
);

-- Migrations for tables created before these columns existed.
alter table chart_symbols add column if not exists color text;
alter table chart_symbols add column if not exists loop_count integer not null default 3;
alter table chart_symbols add column if not exists base_stitch text not null default 'double';

create index if not exists chart_layers_user_id_idx on chart_layers (user_id);
create index if not exists chart_symbols_user_id_idx on chart_symbols (user_id);
create index if not exists chart_symbols_layer_id_idx on chart_symbols (layer_id);

alter table chart_projects enable row level security;
alter table chart_layers enable row level security;
alter table chart_symbols enable row level security;

drop policy if exists "chart_projects_owner" on chart_projects;
create policy "chart_projects_owner" on chart_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "chart_layers_owner" on chart_layers;
create policy "chart_layers_owner" on chart_layers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "chart_symbols_owner" on chart_symbols;
create policy "chart_symbols_owner" on chart_symbols
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Accounts + plans -----------------------------------------------------------
-- Auth (sign up / sign in) is Supabase Auth itself — shared with any other app
-- pointed at this same Supabase project, since auth.users isn't namespaced.
-- This table just tracks this app's per-user plan state. Real billing (Stripe
-- or similar) isn't wired up yet, so `plan` is switched manually for now —
-- either directly in the Supabase dashboard, or via the "premium" self-service
-- test toggle the app exposes (see the RLS policy below), until a payment
-- flow replaces it.

create table if not exists chart_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table chart_profiles enable row level security;

drop policy if exists "chart_profiles_owner" on chart_profiles;
create policy "chart_profiles_owner" on chart_profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Every new auth user gets a free-plan profile row automatically.
create or replace function chart_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.chart_profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists chart_on_auth_user_created on auth.users;
create trigger chart_on_auth_user_created
  after insert on auth.users
  for each row execute function chart_handle_new_user();

-- Backfill for accounts that already existed before this table did.
insert into chart_profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- Multiple saved charts per user -----------------------------------------
-- chart_projects started as one row per user (a single autosave slot); it's
-- now one row per named, saved chart, so a user can have several — up to
-- their plan's limit.

alter table chart_projects add column if not exists id uuid default gen_random_uuid();
alter table chart_projects add column if not exists created_at timestamptz not null default now();
update chart_projects set id = gen_random_uuid() where id is null;
alter table chart_projects alter column id set not null;
alter table chart_projects drop constraint if exists chart_projects_pkey;
alter table chart_projects add primary key (id);
create index if not exists chart_projects_user_id_idx on chart_projects (user_id);

alter table chart_layers add column if not exists project_id uuid references chart_projects (id) on delete cascade;
alter table chart_symbols add column if not exists project_id uuid references chart_projects (id) on delete cascade;

-- Backfill: before this migration every layer/symbol implicitly belonged to
-- its user's one (and only) project.
update chart_layers cl set project_id = cp.id
  from chart_projects cp
  where cl.user_id = cp.user_id and cl.project_id is null;
update chart_symbols cs set project_id = cp.id
  from chart_projects cp
  where cs.user_id = cp.user_id and cs.project_id is null;

create index if not exists chart_layers_project_id_idx on chart_layers (project_id);
create index if not exists chart_symbols_project_id_idx on chart_symbols (project_id);

-- Free plan: capped at 3 saved charts. Enforced here (not just in the app) so
-- the limit actually holds even if someone calls the API directly.
create or replace function chart_enforce_project_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_plan text;
  project_count integer;
begin
  select plan into user_plan from chart_profiles where id = new.user_id;
  if user_plan is distinct from 'premium' then
    select count(*) into project_count from chart_projects where user_id = new.user_id;
    if project_count >= 3 then
      raise exception 'free_plan_project_limit_reached';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists chart_projects_enforce_limit on chart_projects;
create trigger chart_projects_enforce_limit
  before insert on chart_projects
  for each row execute function chart_enforce_project_limit();
