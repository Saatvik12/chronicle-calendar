import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Phone, ScrollText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [channel, setChannel] = useState('email') // 'email' | 'phone'
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  const phoneLooksValid = /^\+[1-9]\d{7,14}$/.test(phoneNumber.trim())

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (channel === 'phone' && !phoneLooksValid) {
      setError('Enter your phone number in international format, e.g. +919876543210')
      return
    }

    setLoading(true)
    const { error } = await signUp({
      email,
      password,
      notificationChannel: channel,
      phoneNumber: channel === 'phone' ? phoneNumber.trim() : null,
    })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }
    setConfirmSent(true)
  }

  if (confirmSent) {
    return (
      <AuthShell>
        <div className="text-center space-y-3">
          <ScrollText className="mx-auto h-8 w-8 text-accent" strokeWidth={1.5} />
          <h2 className="font-display text-2xl">Check your inbox</h2>
          <p className="text-ink-muted text-sm leading-relaxed">
            We've sent a confirmation link to <span className="text-ink">{email}</span>.
            Confirm your address to open your calendar.
          </p>
          <Link
            to="/login"
            className="inline-block mt-4 text-sm text-accent hover:underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h2 className="font-display text-2xl mb-1">Create your calendar</h2>
      <p className="text-ink-muted text-sm mb-6">
        A quiet place to keep track of everything.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="At least 6 characters"
          />
        </Field>

        <div>
          <label className="block text-sm text-ink-muted mb-2">
            How should we send you reminders?
          </label>
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
          <Field label="Phone number">
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="input"
              placeholder="+919876543210"
            />
            <p className="text-xs text-ink-muted mt-1.5">
              Include your country code, e.g. +91 for India.
            </p>
          </Field>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-muted mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

function ChannelOption({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 justify-center rounded-card border px-3 py-2.5 text-sm transition-colors ${
        active
          ? 'border-accent bg-accent-soft text-ink'
          : 'border-border text-ink-muted hover:border-ink-muted'
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </button>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-ink-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm bg-surface-raised border border-border rounded-card p-8 shadow-sm">
        {children}
      </div>
    </div>
  )
}
