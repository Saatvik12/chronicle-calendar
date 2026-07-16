import { format } from 'date-fns'
import { getEventStatus } from '../../lib/eventStatus'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function DayView({ cursorDate, events, onSlotClick, onEventClick }) {
  const key = format(cursorDate, 'yyyy-MM-dd')
  const dayEvents = events.filter((e) => e.event_date === key)
  const allDay = dayEvents.filter((e) => e.is_all_day)
  const timed = dayEvents.filter((e) => !e.is_all_day)

  return (
    <div className="flex-1 overflow-auto max-w-2xl">
      {allDay.length > 0 && (
        <div className="px-6 py-3 border-b border-border space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-ink-muted">All day</span>
          {allDay.map((ev) => {
            const status = getEventStatus(ev)
            return (
              <div
                key={ev.id}
                onClick={() => onEventClick(ev)}
                className={`text-sm px-3 py-1.5 rounded-card cursor-pointer ${
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
      )}

      <div>
        {HOURS.map((hour) => {
          const hourEvents = timed.filter(
            (e) => e.start_time && parseInt(e.start_time.slice(0, 2)) === hour
          )
          return (
            <div
              key={hour}
              onClick={() => onSlotClick(cursorDate, hour)}
              className="flex border-t border-border min-h-[56px] px-6 py-1.5 hover:bg-surface-sunken/40 cursor-pointer"
            >
              <span className="text-[11px] text-ink-muted w-14 shrink-0 pt-0.5">
                {format(new Date(2000, 0, 1, hour), 'h a')}
              </span>
              <div className="flex-1 space-y-1">
                {hourEvents.map((ev) => {
                  const status = getEventStatus(ev)
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(ev)
                      }}
                      className={`text-sm px-3 py-1.5 rounded-card ${
                        status === 'finished' ? 'opacity-40 grayscale' : ''
                      } ${status === 'active' ? 'ring-1 ring-accent font-medium' : ''}`}
                      style={{
                        backgroundColor: `${ev.categories?.color || '#888888'}22`,
                        color: ev.categories?.color || 'inherit',
                      }}
                    >
                      <span className="font-medium">{ev.title}</span>
                      {ev.start_time && (
                        <span className="text-xs opacity-70 ml-2">
                          {ev.start_time.slice(0, 5)}
                          {ev.end_time ? `–${ev.end_time.slice(0, 5)}` : ''}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
