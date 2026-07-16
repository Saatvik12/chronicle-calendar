import { useState } from 'react'
import { Bell, Plus, X, Info } from 'lucide-react'
import {
  RELATIVE_OPTIONS,
  ALLDAY_OPTIONS,
  DEFAULT_ALLDAY_TIME,
} from '../../lib/reminderUtils'

export default function ReminderPicker({ reminders, onChange, hasTime }) {
  const [mode, setMode] = useState('relative') // 'relative' | 'absolute'
  const [offset, setOffset] = useState(15)
  const [daysBefore, setDaysBefore] = useState(1)
  const [timeOfDay, setTimeOfDay] = useState(DEFAULT_ALLDAY_TIME)
  const [absoluteAt, setAbsoluteAt] = useState('')

  const formatTimeLabel = (t) => {
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 === 0 ? 12 : h % 12
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`
  }

  const addReminder = () => {
    if (mode === 'absolute') {
      if (!absoluteAt) return
      onChange([
        ...reminders,
        {
          reminder_type: 'absolute',
          absolute_at: absoluteAt,
          label: `On ${new Date(absoluteAt).toLocaleString()}`,
        },
      ])
      setAbsoluteAt('')
      return
    }

    if (hasTime) {
      const opt = RELATIVE_OPTIONS.find((o) => o.value === offset)
      onChange([
        ...reminders,
        { reminder_type: 'relative', offset_minutes: offset, label: opt.label },
      ])
    } else {
      const opt = ALLDAY_OPTIONS.find((o) => o.daysBefore === daysBefore)
      onChange([
        ...reminders,
        {
          reminder_type: 'relative',
          daysBefore,
          timeOfDay,
          label: `${opt.label}, ${formatTimeLabel(timeOfDay)}`,
        },
      ])
    }
  }

  const removeReminder = (idx) => {
    onChange(reminders.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      {reminders.length > 0 && (
        <ul className="space-y-1.5">
          {reminders.map((r, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between rounded-card bg-surface-sunken px-3 py-1.5 text-sm"
            >
              <span className="flex items-center gap-2 text-ink">
                <Bell className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
                {r.label}
              </span>
              <button
                type="button"
                onClick={() => removeReminder(idx)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-card border border-border p-3 space-y-2.5">
        <div className="flex rounded-card border border-border p-0.5 w-fit">
          <button
            type="button"
            onClick={() => setMode('relative')}
            className={`px-2.5 py-1 text-xs rounded-[8px] ${
              mode === 'relative' ? 'bg-accent text-surface' : 'text-ink-muted'
            }`}
          >
            {hasTime ? 'Relative' : 'Days before'}
          </button>
          <button
            type="button"
            onClick={() => setMode('absolute')}
            className={`px-2.5 py-1 text-xs rounded-[8px] ${
              mode === 'absolute' ? 'bg-accent text-surface' : 'text-ink-muted'
            }`}
          >
            Specific time
          </button>
        </div>

        {mode === 'relative' && hasTime && (
          <select
            value={offset}
            onChange={(e) => setOffset(Number(e.target.value))}
            className="input py-1.5"
          >
            {RELATIVE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}

        {mode === 'relative' && !hasTime && (
          <div className="space-y-2.5">
            <select
              value={daysBefore}
              onChange={(e) => setDaysBefore(Number(e.target.value))}
              className="input py-1.5"
            >
              {ALLDAY_OPTIONS.map((o) => (
                <option key={o.daysBefore} value={o.daysBefore}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-ink-muted shrink-0">At</label>
              <input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="input py-1.5"
              />
            </div>
            <p className="flex items-start gap-1.5 text-xs text-ink-muted">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={1.75} />
              This event has no specific time, so reminders default to 8:00 PM —
              change the time above if you'd like something else.
            </p>
          </div>
        )}

        {mode === 'absolute' && (
          <input
            type="datetime-local"
            value={absoluteAt}
            onChange={(e) => setAbsoluteAt(e.target.value)}
            className="input py-1.5"
          />
        )}

        <button
          type="button"
          onClick={addReminder}
          className="w-full flex items-center justify-center gap-1.5 rounded-card bg-accent text-surface py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add this reminder
        </button>
        <p className="text-xs text-ink-muted text-center">
          You can add multiple reminders — each one you add appears in the list above.
        </p>
      </div>
    </div>
  )
}
