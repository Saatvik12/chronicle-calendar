import { useState } from 'react'
import { Mail, Phone, BellRing } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { subscribeToPush } from '../../lib/push'
import { useAuth } from '../../context/AuthContext'

export default function NotificationSettings() {
  const { profile, session, refreshProfile } = useAuth()
  const [channel, setChannel] = useState(profile?.notification_channel || 'email')
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [pushStatus, setPushStatus] = useState('')

  const phoneLooksValid = /^\+[1-9]\d{7,14}$/.test(phoneNumber.trim())

  const save = async () => {
    setMessage('')
    if (channel === 'phone' && !phoneLooksValid) {
      setMessage('Enter your phone number in international format, e.g. +919876543210')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        notification_channel: channel,
        phone_number: channel === 'phone' ? phoneNumber.trim() : profile?.phone_number || null,
      })
      .eq('id', session.user.id)
    setSaving(false)
    if (error) {
      setMessage(error.message)
      return
    }
    refreshProfile()
    setMessage('Saved.')
  }

  const enablePush = async () => {
    setPushStatus('Requesting permission…')
    try {
      await subscribeToPush(supabase, session.user.id)
      setPushStatus('Browser push enabled on this device.')
    } catch (err) {
      setPushStatus(err.message)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm text-ink-muted mb-2">Reminder channel</label>
        <div className="grid grid-cols-2 gap-2">
          <ChannelOption
            active={channel === 'email'}
            icon={Mail}
            label="Email"
            onClick={() => setChannel('email')}
          />
          <ChannelOption
            active={channel === 'phone'}
            icon={Phone}
            label="Phone (WhatsApp)"
            onClick={() => setChannel('phone')}
          />
        </div>
      </div>

      {channel === 'phone' && (
        <div>
          <label className="block text-sm text-ink-muted mb-1.5">Phone number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+919876543210"
            className="input"
          />
        </div>
      )}

      {message && <p className="text-xs text-ink-muted">{message}</p>}

      <button onClick={save} disabled={saving} className="btn-secondary w-full">
        {saving ? 'Saving…' : 'Save reminder channel'}
      </button>

      <div className="border-t border-border pt-4">
        <label className="flex items-center gap-2 text-sm text-ink-muted mb-2">
          <BellRing className="h-3.5 w-3.5" strokeWidth={1.75} />
          Browser notifications
        </label>
        <p className="text-xs text-ink-muted mb-3 leading-relaxed">
          Optional — get a reminder as a native notification on this device too, in addition to
          your chosen channel above.
        </p>
        <button onClick={enablePush} className="btn-secondary w-full">
          Enable on this device
        </button>
        {pushStatus && <p className="text-xs text-ink-muted mt-2">{pushStatus}</p>}
      </div>
    </div>
  )
}

function ChannelOption({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 justify-center rounded-card border px-3 py-2.5 text-sm transition-colors ${
        active ? 'border-accent bg-accent-soft text-ink' : 'border-border text-ink-muted hover:border-ink-muted'
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </button>
  )
}
