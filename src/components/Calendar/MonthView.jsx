import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from 'date-fns'
import { getEventStatus } from '../../lib/eventStatus'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function MonthView({ cursorDate, events, onDayClick, onEventClick }) {
  const gridStart = startOfWeek(startOfMonth(cursorDate))
  const gridEnd = endOfWeek(endOfMonth(cursorDate))
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const eventsByDay = {}
  for (const ev of events) {
    const key = ev.event_date
    if (!eventsByDay[key]) eventsByDay[key] = []
    eventsByDay[key].push(ev)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="px-3 py-2 text-xs uppercase tracking-wider text-ink-muted text-center"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 overflow-y-auto">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDay[key] || []
          const inMonth = isSameMonth(day, cursorDate)
          const today = isSameDay(day, new Date())

          return (
            <button
              key={key}
              onClick={() => onDayClick(day)}
              className={`border-b border-r border-border p-2 text-left flex flex-col min-h-[104px] hover:bg-surface-sunken/50 transition-colors ${
                inMonth ? '' : 'opacity-40'
              }`}
            >
              <span
                className={`text-xs mb-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                  today ? 'bg-accent text-surface' : 'text-ink-muted'
                }`}
              >
                {format(day, 'd')}
              </span>

              <div className="flex flex-col gap-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((ev) => {
                  const status = getEventStatus(ev)
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(ev)
                      }}
                      className={`text-[11px] leading-tight px-1.5 py-1 rounded truncate transition-opacity ${
                        status === 'finished' ? 'opacity-40 grayscale' : ''
                      } ${status === 'active' ? 'ring-1 ring-accent font-medium' : ''}`}
                      style={{
                        backgroundColor: `${ev.categories?.color || '#888888'}22`,
                        color: ev.categories?.color || 'inherit',
                      }}
                    >
                      {ev.is_all_day ? '' : `${ev.start_time?.slice(0, 5)} · `}
                      {ev.title}
                    </div>
                  )
                })}
                {dayEvents.length > 3 && (
                  <span className="text-[11px] text-ink-muted pl-1.5">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
