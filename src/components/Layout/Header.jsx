import { ChevronLeft, ChevronRight, Plus, Menu } from 'lucide-react'
import { format } from 'date-fns'

const VIEWS = ['month', 'week', 'day']

export default function Header({ view, onViewChange, cursorDate, onNavigate, onNewEvent, onOpenSidebar }) {
  const headerLabel =
    view === 'day' ? format(cursorDate, 'MMM d, yyyy') : format(cursorDate, 'MMMM yyyy')

  return (
    <header className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 px-3 sm:px-8 py-3 sm:py-5 border-b border-border">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden shrink-0 p-1.5 -ml-1.5 rounded-card hover:bg-surface-sunken text-ink-muted hover:text-ink transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>

        <h1 className="font-display text-lg sm:text-2xl truncate">{headerLabel}</h1>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onNavigate(-1)}
            className="p-1.5 rounded-card hover:bg-surface-sunken text-ink-muted hover:text-ink transition-colors"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={() => onNavigate(1)}
            className="p-1.5 rounded-card hover:bg-surface-sunken text-ink-muted hover:text-ink transition-colors"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={() => onNavigate(0)}
            className="hidden sm:inline-block ml-1 text-xs px-2.5 py-1 rounded-card border border-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <div className="flex items-center rounded-card border border-border p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-2 sm:px-3 py-1.5 text-xs rounded-[10px] capitalize transition-colors ${
                view === v ? 'bg-accent text-surface' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <button
          onClick={onNewEvent}
          className="btn-primary flex items-center gap-1.5 px-3 sm:px-4"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          <span className="hidden sm:inline">New event</span>
        </button>
      </div>
    </header>
  )
}
