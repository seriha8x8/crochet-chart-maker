-- 作品管理 (works app) migration: add a genre field to 作品 (projects).
--
-- The `projects` table isn't tracked in schema.sql (it was set up separately from the
-- crochet-chart tables), so this migration lives in its own file. Run it once, by hand,
-- in the Supabase SQL editor for the project backing 毛糸管理/作品管理 — BEFORE deploying
-- the app code that reads/writes projects.genre.
--
-- Nullable and defaults to null, so existing 作品 rows are left with no genre assigned —
-- nothing breaks, and each one can be given a genre next time it's edited.

alter table projects add column if not exists genre text;
