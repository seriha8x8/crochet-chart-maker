-- Crochet Chart Maker schema.
-- Prefixed with chart_ to avoid colliding with other apps sharing this Supabase project.
-- MVP scope: one project per authenticated user (personal use).

create table if not exists chart_projects (
  user_id uuid primary key references auth.users (id) on delete cascade,
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
  loop_count integer not null default 3
);

-- Migrations for tables created before these columns existed.
alter table chart_symbols add column if not exists color text;
alter table chart_symbols add column if not exists loop_count integer not null default 3;

create index if not exists chart_layers_user_id_idx on chart_layers (user_id);
create index if not exists chart_symbols_user_id_idx on chart_symbols (user_id);
create index if not exists chart_symbols_layer_id_idx on chart_symbols (layer_id);

alter table chart_projects enable row level security;
alter table chart_layers enable row level security;
alter table chart_symbols enable row level security;

create policy "chart_projects_owner" on chart_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "chart_layers_owner" on chart_layers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "chart_symbols_owner" on chart_symbols
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
