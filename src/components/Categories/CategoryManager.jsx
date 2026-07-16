import { useState } from 'react'
import { X, Trash2, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const PALETTE = [
  '#B85C38', '#3654A6', '#2F6B4F', '#C79A4B',
  '#8E4585', '#4A7B9D', '#B54848', '#5C6B73',
]

export default function CategoryManager({ open, onClose, categories, onChanged }) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PALETTE[0])
  const [error, setError] = useState('')

  if (!open) return null

  const addCategory = async (e) => {
    e.preventDefault()
    setError('')
    if (!newName.trim()) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name: newName.trim(), color: newColor })

    if (error) {
      setError(error.message.includes('duplicate') ? 'You already have a category with this name.' : error.message)
      return
    }
    setNewName('')
    onChanged()
  }

  const updateColor = async (id, color) => {
    await supabase.from('categories').update({ color }).eq('id', id)
    onChanged()
  }

  const renameCategory = async (id, name) => {
    if (!name.trim()) return
    await supabase.from('categories').update({ name: name.trim() }).eq('id', id)
    onChanged()
  }

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category? Events keep their data but lose the color tag.')) return
    await supabase.from('categories').delete().eq('id', id)
    onChanged()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-surface-raised border border-border rounded-card shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg">Categories</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-4.5 w-4.5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center gap-2.5 rounded-card border border-border px-3 py-2"
              >
                <ColorDot
                  color={cat.color}
                  onChange={(c) => updateColor(cat.id, c)}
                />
                <input
                  defaultValue={cat.name}
                  onBlur={(e) => renameCategory(cat.id, e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="text-ink-muted hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </li>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-ink-muted">No categories yet — add your first below.</p>
            )}
          </ul>

          <form onSubmit={addCategory} className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="New category name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input"
              />
              <button type="submit" className="shrink-0 rounded-card bg-accent p-2.5 text-surface">
                <Plus className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setNewColor(c)}
                  className="h-6 w-6 rounded-full border-2"
                  style={{
                    backgroundColor: c,
                    borderColor: newColor === c ? 'rgb(var(--color-ink))' : 'transparent',
                  }}
                />
              ))}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  )
}

function ColorDot({ color, onChange }) {
  return (
    <label className="relative h-4 w-4 rounded-full shrink-0 cursor-pointer" style={{ backgroundColor: color }}>
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </label>
  )
}
