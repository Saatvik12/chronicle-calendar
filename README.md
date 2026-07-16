# Chronicle — Calendar App

Vite + React + Tailwind + Supabase. Includes month/week/day views, custom
categories, multi-reminder events, a WhatsApp-or-email reminder channel
chosen at signup, optional browser push, and 4 CSS-variable-driven themes.

## 0. What you need before starting

- Node.js 18+ installed
- A free [Supabase](https://supabase.com) account
- A free [Twilio](https://twilio.com) account (for WhatsApp reminders)
- A free [Resend](https://resend.com) account (for email reminders)

---

## 1. Install and run locally (frontend only, no reminders yet)

```bash
cd chronicle-calendar
npm install
cp .env.example .env
```

Leave `.env` as-is for now — you'll fill it in during Step 3. Once filled in:

```bash
npm run dev
```

Opens at `http://localhost:5173`.

---

## 2. Create your Supabase project and database

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick a name, region, and password (save the DB password somewhere).
2. Once it's provisioned, open **SQL Editor** → **New query**.
3. Paste the entire contents of `supabase/schema.sql` and run it. This creates `profiles`, `categories`, `events`, `reminders`, `push_subscriptions`, the auto-profile trigger, and Row Level Security policies.
4. Leave the `pg_cron` block at the bottom of that file commented out for now — you'll come back to it in Step 6.

### Require email confirmation on signup

1. In Supabase, go to **Authentication → Providers → Email**.
2. Make sure **Confirm email** is toggled ON (it's on by default for new projects).
3. Go to **Authentication → URL Configuration** and set your **Site URL** to `http://localhost:5173` for now (you'll update this to your live domain later).

---

## 3. Connect the frontend to Supabase

1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `.env` in the project and fill in:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

4. Run `npm run dev` again, go to `/signup`, create an account, choose email or phone as your reminder channel, and check your inbox for the confirmation link. Once confirmed, you should land on the calendar.

At this point the app fully works for creating events, categories, and reminders — the only missing piece is actually **sending** those reminders, which happens server-side.

---

## 4. Generate VAPID keys (for optional browser push)

```bash
npx web-push generate-vapid-keys
```

This prints a public and private key. Add the **public** one to `.env`:

```
VITE_VAPID_PUBLIC_KEY=the-public-key-it-printed
```

Keep the **private** key handy — it goes into the Edge Function secrets in Step 6, not into `.env`.

---

## 5. Set up WhatsApp (Twilio Sandbox — free)

1. Sign up at [twilio.com](https://twilio.com).
2. In the Twilio Console, go to **Messaging → Try it out → Send a WhatsApp message**. This gives you a sandbox number (usually `+14155238886`) and a join code like `join happy-tiger`.
3. From the phone number you want to receive reminders on, send `join happy-tiger` (your actual code) as a WhatsApp message to that sandbox number. You only need to do this once per phone number — it stays active for 72 hours of inactivity, so you'll occasionally need to re-join while testing.
4. Note down, from the Twilio Console home page: **Account SID** and **Auth Token**.

*(When you're ready to go beyond testing with your own number, Twilio's docs walk through requesting a production WhatsApp sender, which requires Meta business verification.)*

## 5b. Set up email (Resend — free tier)

1. Sign up at [resend.com](https://resend.com).
2. Go to **API Keys** → create one, copy it.
3. For a quick start you can send from Resend's shared test domain; for anything beyond testing, go to **Domains** and verify a domain you own so `RESEND_FROM_EMAIL` can be `reminders@yourdomain.com`.

---

## 6. Deploy the reminder-sending Edge Function

Install the Supabase CLI if you don't have it:

```bash
npm install -g supabase
```

From the project root:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy send-reminders
```

Set the secrets it needs (replace every placeholder with your real values from Steps 4–5b):

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY=your-vapid-public-key \
  VAPID_PRIVATE_KEY=your-vapid-private-key \
  TWILIO_ACCOUNT_SID=your-twilio-account-sid \
  TWILIO_AUTH_TOKEN=your-twilio-auth-token \
  TWILIO_WHATSAPP_FROM=whatsapp:+14155238886 \
  RESEND_API_KEY=your-resend-api-key \
  RESEND_FROM_EMAIL="Chronicle <reminders@yourdomain.com>"
```

Test it manually before wiring up the schedule:

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/send-reminders \
  -H "Authorization: Bearer your-service-role-key"
```

(Find the **service role key** in **Project Settings → API** — keep it secret, never put it in frontend code.) You should get back `{"processed": 0}` if nothing's due yet, or a number if you have reminders currently overdue.

---

## 7. Schedule it to run every minute

Back in the Supabase **SQL Editor**, uncomment and run the `pg_cron` block at the bottom of `supabase/schema.sql`, filling in your project ref and service role key:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'check-reminders-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer your-service-role-key'
    )
  );
  $$
);
```

From here on, Postgres itself calls your Edge Function every minute, which checks for due reminders and sends them. Nothing needs to stay running on your machine.

To confirm it's working: create an event with a reminder set 2 minutes in the future, wait, and check WhatsApp/email.

---

## 8. Deploy the frontend to Vercel

```bash
npm install -g vercel
vercel
```

In the Vercel dashboard, add the same environment variables from your `.env` file (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`) under **Project Settings → Environment Variables**, then redeploy.

Finally, go back to Supabase **Authentication → URL Configuration** and update the **Site URL** to your real Vercel domain, so confirmation email links point to the live app instead of localhost.

---

## Notes on cost

- **Twilio Sandbox**: free, but requires each user to send a join code and re-join periodically. Fine for personal use and testing; not meant to stay this way for a real user base.
- **Resend**: free tier covers a generous number of emails/month for a project this size.
- **Supabase**: free tier covers the database, Edge Functions, and pg_cron for a project this size.
- **Browser push**: always free, no third party involved.

## Project structure

```
src/
  lib/            Supabase client, theme tokens, reminder math, push helper
  context/        Auth + Theme React contexts
  components/
    Auth/         Signup, Login, ProtectedRoute
    Layout/       Sidebar, Header
    Calendar/     Month/Week/Day views + orchestrator
    Events/       Event modal + reminder picker
    Categories/   Category manager modal
    Settings/     Settings modal, theme selector, notification settings
supabase/
  schema.sql                     Full DB schema + RLS + pg_cron template
  functions/send-reminders/      Edge Function: WhatsApp / email / push dispatch
```
