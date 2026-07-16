-- Run this in the Supabase SQL Editor if you already created your tables
-- before this update. Safe to run once; skip if you're setting up fresh
-- (schema.sql already includes this column).

alter table public.reminders add column if not exists label text;
