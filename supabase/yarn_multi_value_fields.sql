-- 毛糸管理 (yarn app) migration: color / material / thickness become multi-select.
--
-- The `yarns` table isn't tracked in schema.sql (it was set up separately from the
-- crochet-chart tables), so this migration lives in its own file. Run it once, by hand,
-- in the Supabase SQL editor for the project backing 毛糸管理 — BEFORE deploying the
-- app code that expects color/material/thickness to be text[] instead of text.
--
-- Existing single values are preserved by wrapping them in a one-element array. Since the
-- new UI offers a fixed list of options (colors, materials, needle/hook sizes) instead of
-- free text, an old value that doesn't match any of those options will still be stored —
-- it just won't show any box pre-checked until the yarn is edited and re-saved.

alter table yarns add column if not exists color_new text[] not null default '{}';
update yarns set color_new = case when color is not null and color <> '' then array[color] else '{}'::text[] end;
alter table yarns drop column if exists color;
alter table yarns rename column color_new to color;

alter table yarns add column if not exists material_new text[] not null default '{}';
update yarns set material_new = case when material is not null and material <> '' then array[material] else '{}'::text[] end;
alter table yarns drop column if exists material;
alter table yarns rename column material_new to material;

alter table yarns add column if not exists thickness_new text[] not null default '{}';
update yarns set thickness_new = case when thickness is not null and thickness <> '' then array[thickness] else '{}'::text[] end;
alter table yarns drop column if exists thickness;
alter table yarns rename column thickness_new to thickness;
