import { useEffect, useState } from 'react'
import { X, Trash2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import { computeTriggerAt, timeStringToMinutes } from '../../lib/reminderUtils'
import ReminderPicker from './ReminderPicker'

const emptyForm = {
  title: '',
  description: '',
  event_date: format(new Date(), 'yyyy-MM-dd'),
  hasTime: false,
  start_time: '',
  end_time: '',
  category_id: '',
}

export default function EventModal({
  open,
  onClose,
  onSaved,
  onDeleted,
  categories,
  initialDate,
  initialHour,
  existingEvent,
}) {
  const [form, setForm] = useState(emptyForm)
  const [reminders, setReminders] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    if (existingEvent) {
      setForm({
        title: existingEvent.title,
        description: existingEvent.description || '',
        event_date: existingEvent.event_date,
        hasTime: !existingEvent.is_all_day,
        start_time: existingEvent.start_time?.slice(0, 5) || '',
        end_time: existingEvent.end_time?.slice(0, 5) || '',
        category_id: existingEvent.category_id || '',
      })
      loadReminders(existingEvent.id)
    } else {
      setForm({
        ...emptyForm,
        event_date: format(initialDate || new Date(), 'yyyy-MM-dd'),
        hasTime: initialHour !== undefined && initialHour !== null,
        start_time:
          initialHour !== undefined && initialHour !== null
            ? `${String(initialHour).padStart(2, '0')}:00`
            : '',
        category_id: categories[0]?.id || '',
      })
      setReminders([])
    }
    setError('')
  }, [open, existingEvent, initialDate, initialHour])

  const loadReminders = async (eventId) => {
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('event_id', eventId)
      .order('trigger_at', { ascending: true })
    setReminders(
      (data || []).map((r) => ({
        id: r.id,
        reminder_type: r.reminder_type,
        offset_minutes: r.offset_minutes,
        absolute_at: r.trigger_at,
        label: r.label || (r.reminder_type === 'absolute'
          ? `On ${new Date(r.trigger_at).toLocaleString()}`
          : `${r.offset_minutes} min before`),
      }))
    )
  }

  if (!open) return null

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('Give this event a title.')
      return
    }

    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date,
      start_time: form.hasTime && form.start_time ? form.start_time : null,
      end_time: form.hasTime && form.end_time ? form.end_time : null,
      category_id: form.category_id || null,
    }

    let eventId = existingEvent?.id
    let saveError

    if (existingEvent) {
      const { error } = await supabase.from('events').update(payload).eq('id', existingEvent.id)
      saveError = error
    } else {
      const { data, error } = await supabase.from('events').insert(payload).select().single()
      saveError = error
      eventId = data?.id
    }

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    // Replace reminders wholesale — simplest correct approach for a modal-based editor
    await supabase.from('reminders').delete().eq('event_id', eventId)

    if (reminders.length > 0) {
      const eventForCalc = { event_date: form.event_date, start_time: form.hasTime ? form.start_time : null }
      const rows = reminders.map((r) => {
        let offsetMinutes = null
        if (r.reminder_type === 'relative') {
          offsetMinutes =
            r.offset_minutes !== undefined
              ? r.offset_minutes
              : r.daysBefore * 1440 - timeStringToMinutes(r.timeOfDay)
        }
        return {
          event_id: eventId,
          user_id: user.id,
          reminder_type: r.reminder_type,
          offset_minutes: offsetMinutes,
          label: r.label,
          trigger_at: computeTriggerAt(eventForCalc, r),
          is_sent: false,
        }
      })
      const { error: remError } = await supabase.from('reminders').insert(rows)
      if (remError) {
        setError(remError.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    onSaved()
  }

  const handleDelete = async () => {
    if (!existingEvent) return
    if (!confirm('Delete this event? This can\'t be undone.')) return
    await supabase.from('events').delete().eq('id', existingEvent.id)
    onDeleted()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-surface-raised border border-border rounded-card shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg">
            {existingEvent ? 'Edit event' : 'New event'}
          </h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-4.5 w-4.5" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <input
            type="text"
            required
            autoFocus
            placeholder="Event title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input text-base font-medium"
          />

          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="input resize-none"
          />

          <div>
            <label className="block text-sm text-ink-muted mb-1.5">Date</label>
            <input
              type="date"
              required
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              className="input"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasTime}
              onChange={(e) => setForm({ ...form, hasTime: e.target.checked })}
              className="accent-accent h-4 w-4"
            />
            <Clock className="h-3.5 w-3.5 text-ink-muted" strokeWidth={1.75} />
            Add a specific time
          </label>

          {form.hasTime && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink-muted mb-1.5">Start</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1.5">End</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-ink-muted mb-1.5">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="input"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-ink-muted mb-1.5">Reminders</label>
            <ReminderPicker
              reminders={reminders}
              onChange={setReminders}
              hasTime={form.hasTime}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center gap-2 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Save event'}
            </button>
            {existingEvent && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-card border border-border p-2.5 text-ink-muted hover:text-red-500 hover:border-red-300 transition-colors"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
