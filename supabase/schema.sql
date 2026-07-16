-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  theme text default 'minimalist_light',
  notification_channel text default 'email' check (notification_channel in ('email', 'phone')),
  phone_number text, -- E.164 format, e.g. +919876543210
  created_at timestamptz default now()
);

-- Auto-create profile on signup, pulling the notification choice
-- and phone number out of the signUp() options.data metadata.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, notification_channel, phone_number)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'notification_channel', 'email'),
    new.raw_user_meta_data ->> 'phone_number'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- CATEGORIES
-- ============================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- ============================================
-- EVENTS
-- ============================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text,
  event_date date not null,
  start_time time,
  end_time time,
  is_all_day boolean generated always as (start_time is null) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_events_user_date on public.events(user_id, event_date);

-- ============================================
-- REMINDERS
-- ============================================
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('relative', 'absolute')),
  offset_minutes int,
  label text, -- human-readable summary, e.g. "The night before, 8:00 PM"
  trigger_at timestamptz not null,
  is_sent boolean default false,
  created_at timestamptz default now()
);

create index idx_reminders_pending on public.reminders(trigger_at) where is_sent = false;

-- ============================================
-- PUSH SUBSCRIPTIONS (browser Web Push, optional add-on channel)
-- ============================================
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  unique(user_id, endpoint)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.events enable row level security;
alter table public.reminders enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Users manage own categories" on public.categories
  for all using (auth.uid() = user_id);

create policy "Users manage own events" on public.events
  for all using (auth.uid() = user_id);

create policy "Users manage own reminders" on public.reminders
  for all using (auth.uid() = user_id);

create policy "Users manage own push subs" on public.push_subscriptions
  for all using (auth.uid() = user_id);

-- ============================================
-- pg_cron + pg_net: fire the send-reminders Edge Function every minute
-- Run this section AFTER you've deployed the Edge Function and know
-- your project ref + service role key (see README Step 6).
-- ============================================
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
--
-- select cron.schedule(
--   'check-reminders-every-minute',
--   '* * * * *',
--   $$
--   select net.http_post(
--     url := 'https://<your-project-ref>.supabase.co/functions/v1/send-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <your-service-role-key>'
--     )
--   );
--   $$
-- );
