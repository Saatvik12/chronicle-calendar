import { ScrollText, Settings, Tag, LogOut, List, LayoutGrid, Bell, X } from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar({
  categories,
  categoryCounts,
  activeCategoryIds,
  onToggleCategory,
  onOpenCategoryManager,
  onOpenSettings,
  sidebarMode,
  onSidebarModeChange,
  upcomingReminders,
  onOpenEvent,
  onClose,
}) {
  const { signOut, profile } = useAuth()

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-surface-raised flex flex-col h-screen">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-accent" strokeWidth={1.75} />
            <span className="font-display text-lg tracking-tight">Chronicle</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-ink-muted hover:text-ink p-1"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex rounded-card border border-border p-0.5">
          <button
            onClick={() => onSidebarModeChange('categories')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-[10px] transition-colors ${
              sidebarMode === 'categories' ? 'bg-accent text-surface' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} />
            Categories
          </button>
          <button
            onClick={() => onSidebarModeChange('upcoming')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-[10px] transition-colors ${
              sidebarMode === 'upcoming' ? 'bg-accent text-surface' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <List className="h-3.5 w-3.5" strokeWidth={1.75} />
            Upcoming
          </button>
        </div>
      </div>

      <div className="px-5 flex-1 overflow-y-auto">
        {sidebarMode === 'categories' ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs uppercase tracking-wider text-ink-muted">Categories</h3>
              <button
                onClick={onOpenCategoryManager}
                className="text-ink-muted hover:text-accent transition-colors"
                title="Manage categories"
              >
                <Tag className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>

            <ul className="space-y-1">
              {categories.map((cat) => {
                const active = activeCategoryIds.has(cat.id)
                const count = categoryCounts?.[cat.id] || 0
                return (
                  <li key={cat.id}>
                    <button
                      onClick={() => onToggleCategory(cat.id)}
                      className={`w-full flex items-center gap-2.5 rounded-card px-2 py-1.5 text-sm transition-colors ${
                        active ? 'text-ink' : 'text-ink-muted'
                      } hover:bg-surface-sunken`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color, opacity: active ? 1 : 0.35 }}
                      />
                      <span className="truncate flex-1 text-left">{cat.name}</span>
                      {count > 0 && (
                        <span className="text-[11px] text-ink-muted bg-surface-sunken rounded-full px-1.5 py-0.5 shrink-0">
                          {count}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
              {categories.length === 0 && (
                <p className="text-xs text-ink-muted py-2">No categories yet.</p>
              )}
            </ul>
            <p className="text-[11px] text-ink-muted mt-3 leading-relaxed">
              The number next to each category is how many of its events are happening now or still upcoming.
            </p>
          </>
        ) : (
          <UpcomingList reminders={upcomingReminders} onOpenEvent={onOpenEvent} />
        )}
      </div>

      <div className="px-5 py-4 border-t border-border">
        <p className="text-xs text-ink-muted truncate mb-3">{profile?.email}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-card border border-border py-2 text-xs text-ink-muted hover:text-ink hover:border-ink-muted transition-colors"
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={1.75} />
            Settings
          </button>
          <button
            onClick={signOut}
            className="rounded-card border border-border p-2 text-ink-muted hover:text-ink hover:border-ink-muted transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function UpcomingList({ reminders, onOpenEvent }) {
  if (!reminders || reminders.length === 0) {
    return <p className="text-xs text-ink-muted py-2">No upcoming reminders scheduled.</p>
  }

  const groups = {}
  for (const r of reminders) {
    const localDate = new Date(r.trigger_at)
    const dayKey = format(localDate, 'yyyy-MM-dd') // local date, not the raw UTC date
    if (!groups[dayKey]) groups[dayKey] = { date: localDate, items: [] }
    groups[dayKey].items.push(r)
  }

  const dayLabel = (date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEEE, MMM d')
  }

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([dayKey, group]) => (
        <div key={dayKey}>
          <h4 className="text-xs uppercase tracking-wider text-ink-muted mb-1.5">
            {dayLabel(group.date)}
          </h4>
          <ul className="space-y-1">
            {group.items.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => onOpenEvent(r.events?.id)}
                  className="w-full flex items-start gap-2 rounded-card px-2 py-1.5 text-left hover:bg-surface-sunken transition-colors"
                >
                  <Bell className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span className="min-w-0">
                    <span className="block text-sm text-ink truncate">
                      {r.events?.title || 'Untitled event'}
                    </span>
                    <span className="block text-[11px] text-ink-muted">
                      {format(new Date(r.trigger_at), 'h:mm a')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
