import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-ink-muted text-sm font-display">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Supabase only issues a session after email confirmation when
  // "Confirm email" is enabled in Auth settings, so reaching here
  // already implies a confirmed user. This check is a defensive backstop.
  if (session.user && session.user.email_confirmed_at === null) {
    return <Navigate to="/login" replace />
  }

  return children
}
