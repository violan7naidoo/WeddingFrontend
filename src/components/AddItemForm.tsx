import { useState } from 'react'
import { weddingApi } from '../api/weddingApi'
import type { CategoryDto, WeddingItemDto } from '../types/api'

interface AddItemFormProps {
  dayId: number
  category: CategoryDto
  token: string
  existingItem?: WeddingItemDto | null
  onClose: () => void
  onCreated: () => void
}

export default function AddItemForm({
  dayId,
  category,
  token,
  existingItem,
  onClose,
  onCreated,
}: AddItemFormProps) {
  const [name, setName] = useState(existingItem?.name ?? '')
  const [vendorName, setVendorName] = useState(existingItem?.vendorName ?? '')
  const [notes, setNotes] = useState(existingItem?.notes ?? '')
  const [estimatedCost, setEstimatedCost] = useState(
    existingItem?.estimatedCost?.toString() ?? ''
  )
  const [depositPaid, setDepositPaid] = useState(
    existingItem?.depositPaid?.toString() ?? ''
  )
  const [percentageComplete, setPercentageComplete] = useState(
    existingItem?.percentageComplete?.toString() ?? ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const common = {
        name: name.trim(),
        vendorName: vendorName.trim() || null,
        notes: notes.trim() || null,
        estimatedCost: parseNum(estimatedCost),
        depositPaid: parseNum(depositPaid),
        percentageComplete: parseNum(percentageComplete),
      }
      if (existingItem) {
        await weddingApi.items.update(existingItem.id, common, token)
      } else {
        await weddingApi.items.create({ dayId, categoryId: category.id, ...common }, token)
      }
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">
          {existingItem ? 'Edit item' : 'Add item'} – {category.name}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Name / Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
              placeholder="e.g. Catering quote – Company A"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Vendor name
            </label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
              placeholder="Optional"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Est. cost
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Deposit paid
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={depositPaid}
                onChange={(e) => setDepositPaid(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                % complete
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={percentageComplete}
                onChange={(e) => setPercentageComplete(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
              rows={2}
              placeholder="Optional"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : existingItem ? 'Update' : 'Add item'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function parseNum(s: string): number | null {
  if (s.trim() === '') return null
  const n = parseFloat(s)
  return Number.isNaN(n) ? null : n
}
