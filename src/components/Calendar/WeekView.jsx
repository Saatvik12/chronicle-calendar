import { Fragment } from 'react'
import { startOfWeek, addDays, format, isSameDay } from 'date-fns'
import { getEventStatus } from '../../lib/eventStatus'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function WeekView({ cursorDate, events, onSlotClick, onEventClick }) {
  const weekStart = startOfWeek(cursorDate)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const eventsByDay = {}
  for (const ev of events) {
    const key = ev.event_date
    if (!eventsByDay[key]) eventsByDay[key] = []
    eventsByDay[key].push(ev)
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-[56px_repeat(7,minmax(72px,1fr))] sticky top-0 bg-surface z-10 border-b border-border">
        <div />
        {days.map((day) => {
          const today = isSameDay(day, new Date())
          return (
            <div key={day.toISOString()} className="px-2 py-2 text-center border-l border-border">
              <div className="text-[11px] uppercase tracking-wider text-ink-muted">
                {format(day, 'EEE')}
              </div>
              <div
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm mt-0.5 ${
                  today ? 'bg-accent text-surface' : ''
                }`}
              >
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* All-day row */}
      <div className="grid grid-cols-[56px_repeat(7,minmax(72px,1fr))] border-b border-border">
        <div className="text-[10px] text-ink-muted px-2 py-1.5">All day</div>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const allDay = (eventsByDay[key] || []).filter((e) => e.is_all_day)
          return (
            <div key={key} className="border-l border-border px-1 py-1 space-y-1 min-h-[32px]">
              {allDay.map((ev) => {
                const status = getEventStatus(ev)
                return (
                  <div
                    key={ev.id}
                    onClick={() => onEventClick(ev)}
                    className={`text-[11px] px-1.5 py-0.5 rounded truncate cursor-pointer ${
                      status === 'finished' ? 'opacity-40 grayscale' : ''
                    } ${status === 'active' ? 'ring-1 ring-accent font-medium' : ''}`}
                    style={{
                      backgroundColor: `${ev.categories?.color || '#888888'}22`,
                      color: ev.categories?.color || 'inherit',
                    }}
                  >
                    {ev.title}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-[56px_repeat(7,minmax(72px,1fr))]">
        {HOURS.map((hour) => (
          <Fragment key={hour}>
            <div
              key={`label-${hour}`}
              className="text-[10px] text-ink-muted px-2 pt-1 border-t border-border"
            >
              {format(new Date(2000, 0, 1, hour), 'h a')}
            </div>
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const hourEvents = (eventsByDay[key] || []).filter(
                (e) => !e.is_all_day && e.start_time && parseInt(e.start_time.slice(0, 2)) === hour
              )
              return (
                <div
                  key={`${key}-${hour}`}
                  onClick={() => onSlotClick(day, hour)}
                  className="border-l border-t border-border min-h-[48px] px-1 py-0.5 hover:bg-surface-sunken/40 cursor-pointer"
                >
                  {hourEvents.map((ev) => {
                    const status = getEventStatus(ev)
                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(ev)
                        }}
                        className={`text-[11px] px-1.5 py-0.5 rounded truncate mb-0.5 ${
                          status === 'finished' ? 'opacity-40 grayscale' : ''
                        } ${status === 'active' ? 'ring-1 ring-accent font-medium' : ''}`}
                        style={{
                          backgroundColor: `${ev.categories?.color || '#888888'}22`,
                          color: ev.categories?.color || 'inherit',
                        }}
                      >
                        {ev.title}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
