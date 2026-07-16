// Returns 'finished' | 'active' | 'upcoming' for a given event relative to `now`.
//
// - All-day events are 'active' for their entire calendar day, and become
//   'finished' the moment the next day begins.
// - Timed events are 'active' between start_time and end_time (or start_time
//   to start_time+1h if no end_time was set), 'upcoming' before that, and
//   'finished' after.
export function getEventStatus(event, now = new Date()) {
  const dayStart = new Date(`${event.event_date}T00:00:00`)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  if (event.is_all_day) {
    if (now < dayStart) return 'upcoming'
    if (now >= dayStart && now < dayEnd) return 'active'
    return 'finished'
  }

  const start = new Date(`${event.event_date}T${event.start_time}`)
  const end = event.end_time
    ? new Date(`${event.event_date}T${event.end_time}`)
    : new Date(start.getTime() + 60 * 60 * 1000)

  if (now < start) return 'upcoming'
  if (now >= start && now < end) return 'active'
  return 'finished'
}

export function isEventUnfinished(event, now = new Date()) {
  return getEventStatus(event, now) !== 'finished'
}
