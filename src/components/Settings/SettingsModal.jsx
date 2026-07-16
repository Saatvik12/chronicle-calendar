import { useState } from 'react'
import { X } from 'lucide-react'
import ThemeSelector from './ThemeSelector'
import NotificationSettings from './NotificationSettings'

const TABS = ['Appearance', 'Notifications']

export default function SettingsModal({ open, onClose }) {
  const [tab, setTab] = useState('Appearance')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-surface-raised border border-border rounded-card shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg">Settings</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-4.5 w-4.5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs rounded-card transition-colors ${
                tab === t ? 'bg-accent text-surface' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-6 py-5">
          {tab === 'Appearance' && <ThemeSelector />}
          {tab === 'Notifications' && <NotificationSettings />}
        </div>
      </div>
    </div>
  )
}
