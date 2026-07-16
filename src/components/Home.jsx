import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabaseClient'
import { isEventUnfinished } from '../lib/eventStatus'
import Sidebar from './Layout/Sidebar'
import CalendarView from './Calendar/CalendarView'
import EventModal from './Events/EventModal'
import CategoryManager from './Categories/CategoryManager'
import SettingsModal from './Settings/SettingsModal'

export default function Home() {
  const [categories, setCategories] = useState([])
  const [activeCategoryIds, setActiveCategoryIds] = useState(new Set())
  const [sidebarMode, setSidebarMode] = useState('categories') // 'categories' | 'upcoming'
  const [sidebarOpen, setSidebarOpen] = useState(false) // mobile drawer, closed by default
  const [unfinishedEvents, setUnfinishedEvents] = useState([])
  const [upcomingReminders, setUpcomingReminders] = useState([])

  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [editingEvent, setEditingEvent] = useState(null)
  const [draftDate, setDraftDate] = useState(null)
  const [draftHour, setDraftHour] = useState(null)

  const [refreshSignal, setRefreshSignal] = useState(0)

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('created_at')
    setCategories(data || [])
    setActiveCategoryIds(new Set()) // empty set = "show all"
  }, [])

  // Events from today onward, used to compute the "active in this category" counts.
  const fetchUnfinishedEvents = useCallback(async () => {
    const todayKey = format(new Date(), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('events')
      .select('*, categories(id, name, color)')
      .gte('event_date', todayKey)
    setUnfinishedEvents((data || []).filter((e) => isEventUnfinished(e)))
  }, [])

  // Reminders not yet sent, soonest first, for the Upcoming sidebar panel.
  const fetchUpcomingReminders = useCallback(async () => {
    const { data } = await supabase
      .from('reminders')
      .select('id, trigger_at, label, events(id, title, event_date, categories(color))')
      .eq('is_sent', false)
      .gte('trigger_at', new Date().toISOString())
      .order('trigger_at', { ascending: true })
      .limit(50)
    setUpcomingReminders(data || [])
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchUnfinishedEvents()
    fetchUpcomingReminders()
  }, [fetchUnfinishedEvents, fetchUpcomingReminders, refreshSignal])

  const categoryCounts = {}
  for (const ev of unfinishedEvents) {
    if (!ev.category_id) continue
    categoryCounts[ev.category_id] = (categoryCounts[ev.category_id] || 0) + 1
  }

  const toggleCategory = (id) => {
    setActiveCategoryIds((prev) => {
      const next = new Set(prev)
      // If nothing is filtered yet, start filtering by selecting only this one
      if (next.size === 0) {
        return new Set(categories.filter((c) => c.id === id).map((c) => c.id))
      }
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      // If everything ends up selected, treat as "show all" again
      if (next.size === categories.length) return new Set()
      return next
    })
  }

  const openNewEvent = (date, hour) => {
    setEditingEvent(null)
    setDraftDate(date)
    setDraftHour(hour)
    setEventModalOpen(true)
  }

  const openExistingEvent = (event) => {
    setEditingEvent(event)
    setEventModalOpen(true)
  }

  const openEventById = async (eventId) => {
    const { data } = await supabase.from('events').select('*, categories(id, name, color)').eq('id', eventId).single()
    if (data) openExistingEvent(data)
  }

  const closeEventModal = () => {
    setEventModalOpen(false)
    setEditingEvent(null)
  }

  const onEventSaved = () => {
    closeEventModal()
    setRefreshSignal((n) => n + 1)
  }

  const onEventDeleted = () => {
    closeEventModal()
    setRefreshSignal((n) => n + 1)
  }

  return (
    <div className="flex h-screen bg-surface text-ink overflow-hidden">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          categories={categories}
          categoryCounts={categoryCounts}
          activeCategoryIds={
            activeCategoryIds.size === 0 ? new Set(categories.map((c) => c.id)) : activeCategoryIds
          }
          onToggleCategory={toggleCategory}
          onOpenCategoryManager={() => setCategoryModalOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          sidebarMode={sidebarMode}
          onSidebarModeChange={setSidebarMode}
          upcomingReminders={upcomingReminders}
          onOpenEvent={openEventById}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <CalendarView
        activeCategoryIds={activeCategoryIds}
        onOpenEvent={openExistingEvent}
        onNewEvent={openNewEvent}
        refreshSignal={refreshSignal}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      <EventModal
        open={eventModalOpen}
        onClose={closeEventModal}
        onSaved={onEventSaved}
        onDeleted={onEventDeleted}
        categories={categories}
        initialDate={draftDate}
        initialHour={draftHour}
        existingEvent={editingEvent}
      />

      <CategoryManager
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        onChanged={fetchCategories}
      />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
