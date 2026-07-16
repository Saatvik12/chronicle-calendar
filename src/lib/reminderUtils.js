// --- Timed events: minute-based relative options ---
export const RELATIVE_OPTIONS = [
  { label: 'At time of event', value: 0 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
  { label: '1 week before', value: 10080 },
]

// --- All-day events: day-granularity options, all anchored to a time of day ---
// (default 8:00 PM the night before, editable)
export const ALLDAY_OPTIONS = [
  { label: 'The night before', daysBefore: 1 },
  { label: '2 days before', daysBefore: 2 },
  { label: '3 days before', daysBefore: 3 },
  { label: '1 week before', daysBefore: 7 },
]

export const DEFAULT_ALLDAY_TIME = '20:00'

/**
 * The "anchor" instant a reminder is measured against:
 * the event's start time if it has one, otherwise midnight
 * at the start of the event's date.
 */
export function getEventDateTime(event) {
  const time = event.start_time || '00:00:00'
  return new Date(`${event.event_date}T${time}`)
}

export function timeStringToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

/**
 * Given an event and a reminder draft, compute the absolute UTC
 * trigger_at ISO string that gets stored in the reminders table.
 *
 * draft shapes:
 *  - { reminder_type: 'absolute', absolute_at }
 *  - { reminder_type: 'relative', offset_minutes }              (timed events)
 *  - { reminder_type: 'relative', daysBefore, timeOfDay }        (all-day events)
 */
export function computeTriggerAt(event, draft) {
  if (draft.reminder_type === 'absolute') {
    return new Date(draft.absolute_at).toISOString()
  }

  const anchor = getEventDateTime(event)

  if (draft.daysBefore !== undefined) {
    const timeMinutes = timeStringToMinutes(draft.timeOfDay || DEFAULT_ALLDAY_TIME)
    const offsetMinutes = draft.daysBefore * 1440 - timeMinutes
    return new Date(anchor.getTime() - offsetMinutes * 60 * 1000).toISOString()
  }

  return new Date(anchor.getTime() - draft.offset_minutes * 60 * 1000).toISOString()
}

export function formatOffsetLabel(minutes) {
  const found = RELATIVE_OPTIONS.find((o) => o.value === minutes)
  return found ? found.label : `${minutes} min before`
}
