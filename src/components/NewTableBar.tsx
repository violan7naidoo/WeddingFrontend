import { useState } from 'react'
import { weddingApi } from '../api/weddingApi'

type Props = {
  dayId: number
  token: string
  onCreated: () => void
}

export default function NewTableBar({ dayId, token, onCreated }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await weddingApi.categories.create(dayId, name.trim(), token)
      setName('')
      setAdding(false)
      onCreated()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error creating table')
    } finally {
      setSaving(false)
    }
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="mb-5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-rose-300 hover:text-rose-700"
      >
        + New table
      </button>
    )
  }

  return (
    <div className="mb-5 flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd()
          if (e.key === 'Escape') { setAdding(false); setName('') }
        }}
        placeholder="Table name…"
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={saving || !name.trim()}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? '…' : 'Add'}
      </button>
      <button
        type="button"
        onClick={() => { setAdding(false); setName('') }}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        Cancel
      </button>
    </div>
  )
}
