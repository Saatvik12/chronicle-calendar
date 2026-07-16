import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// --- Web Push (optional add-on channel, works regardless of email/phone choice) ---
const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')
const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails('mailto:you@example.com', vapidPublic, vapidPrivate)
}

async function sendWhatsApp(phoneNumber: string, title: string, body: string) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_WHATSAPP_FROM') // e.g. 'whatsapp:+14155238886'
  if (!accountSid || !authToken || !fromNumber) {
    console.error('Twilio env vars missing, skipping WhatsApp send')
    return
  }

  const auth = btoa(`${accountSid}:${authToken}`)
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: fromNumber,
      To: `whatsapp:${phoneNumber}`,
      Body: `⏰ ${title}\n${body}`,
    }),
  })

  if (!res.ok) console.error('Twilio WhatsApp send failed:', await res.text())
}

async function sendEmail(toEmail: string, title: string, body: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') // e.g. 'Chronicle <reminders@yourdomain.com>'
  if (!resendKey || !fromEmail) {
    console.error('Resend env vars missing, skipping email send')
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toEmail,
      subject: `Reminder: ${title}`,
      html: `<p><strong>${title}</strong></p><p>${body}</p>`,
    }),
  })

  if (!res.ok) console.error('Resend email send failed:', await res.text())
}

async function sendWebPush(userId: string, title: string, body: string) {
  if (!vapidPublic || !vapidPrivate) return

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body })
      )
    } catch (err: any) {
      if (err.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      } else {
        console.error('Web push failed:', err)
      }
    }
  }
}

Deno.serve(async () => {
  const { data: dueReminders, error } = await supabase
    .from('reminders')
    .select('id, user_id, event_id, events(title, description, event_date, start_time)')
    .eq('is_sent', false)
    .lte('trigger_at', new Date().toISOString())

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })
  if (!dueReminders?.length) return new Response(JSON.stringify({ processed: 0 }))

  for (const reminder of dueReminders) {
    const event = reminder.events as any
    if (!event) {
      await supabase.from('reminders').update({ is_sent: true }).eq('id', reminder.id)
      continue
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, phone_number, notification_channel')
      .eq('id', reminder.user_id)
      .single()

    const title = event.title
    const body = event.start_time
      ? `Starting at ${event.start_time.slice(0, 5)} on ${event.event_date}`
      : `All-day event on ${event.event_date}`

    if (profile?.notification_channel === 'phone' && profile.phone_number) {
      await sendWhatsApp(profile.phone_number, title, body)
    } else if (profile?.email) {
      await sendEmail(profile.email, title, body)
    }

    // Web push always fires as a bonus channel if the user has enabled it on a device
    await sendWebPush(reminder.user_id, title, body)

    await supabase.from('reminders').update({ is_sent: true }).eq('id', reminder.id)
  }

  return new Response(JSON.stringify({ processed: dueReminders.length }))
})
