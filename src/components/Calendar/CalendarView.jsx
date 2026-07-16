import { useEffect, useState, useCallback } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  addWeeks,
  addDays,
  format,
} from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import Header from '../Layout/Header'
import MonthView from './MonthView'
import WeekView from './WeekView'
import DayView from './DayView'

export default function CalendarView({
  activeCategoryIds,
  onOpenEvent,
  onNewEvent,
  refreshSignal,
  onOpenSidebar,
}) {
  const [view, setView] = useState('month')
  const [cursorDate, setCursorDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const range = getVisibleRange(view, cursorDate)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*, categories(id, name, color)')
      .gte('event_date', format(range.start, 'yyyy-MM-dd'))
      .lte('event_date', format(range.end, 'yyyy-MM-dd'))
      .order('start_time', { ascending: true, nullsFirst: true })

    if (!error) setEvents(data || [])
    setLoading(false)
  }, [range.start, range.end])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents, refreshSignal])

  const visibleEvents = events.filter(
    (e) => activeCategoryIds.size === 0 || activeCategoryIds.has(e.category_id)
  )

  const handleNavigate = (dir) => {
    if (dir === 0) {
      setCursorDate(new Date())
      return
    }
    setCursorDate((prev) => {
      if (view === 'month') return addMonths(prev, dir)
      if (view === 'week') return addWeeks(prev, dir)
      return addDays(prev, dir)
    })
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Header
        view={view}
        onViewChange={setView}
        cursorDate={cursorDate}
        onNavigate={handleNavigate}
        onNewEvent={() => onNewEvent(cursorDate)}
        onOpenSidebar={onOpenSidebar}
      />

      {view === 'month' && (
        <MonthView
          cursorDate={cursorDate}
          events={visibleEvents}
          onDayClick={(day) => onNewEvent(day)}
          onEventClick={onOpenEvent}
        />
      )}
      {view === 'week' && (
        <WeekView
          cursorDate={cursorDate}
          events={visibleEvents}
          onSlotClick={(day, hour) => onNewEvent(day, hour)}
          onEventClick={onOpenEvent}
        />
      )}
      {view === 'day' && (
        <DayView
          cursorDate={cursorDate}
          events={visibleEvents}
          onSlotClick={(day, hour) => onNewEvent(day, hour)}
          onEventClick={onOpenEvent}
        />
      )}
    </div>
  )
}

function getVisibleRange(view, cursorDate) {
  if (view === 'month') {
    return { start: startOfWeek(startOfMonth(cursorDate)), end: endOfWeek(endOfMonth(cursorDate)) }
  }
  if (view === 'week') {
    return { start: startOfWeek(cursorDate), end: endOfWeek(cursorDate) }
  }
  return { start: cursorDate, end: cursorDate }
}
