import { useState } from 'react'
import { fetchWithAuth } from '../api/client'
import type { WeddingItemDto } from '../types/api'
import AddItemForm from './AddItemForm'
import type { CategoryDto } from '../types/api'

interface ItemCardProps {
  item: WeddingItemDto
  canEdit: boolean
  onUpdated: () => void
  onDeleted: () => void
  token: string | null
}

export default function ItemCard({ item, canEdit, onUpdated, onDeleted, token }: ItemCardProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!token || !confirm('Delete this item?')) return
    setDeleting(true)
    try {
      const res = await fetchWithAuth(`/api/wedding/items/${item.id}`, {
        method: 'DELETE',
        token,
      })
      if (res.ok) onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  const categoryForEdit: CategoryDto = {
    id: item.categoryId,
    name: item.categoryName,
    displayOrder: 0,
  }

  if (editing && token) {
    return (
      <AddItemForm
        dayId={item.dayId}
        category={categoryForEdit}
        token={token}
        existingItem={item}
        onClose={() => setEditing(false)}
        onCreated={onUpdated}
      />
    )
  }

  return (
    <li className="flex items-start justify-between gap-2 rounded border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-800">{item.name}</p>
        {item.vendorName && (
          <p className="text-sm text-slate-600">Vendor: {item.vendorName}</p>
        )}
        {(item.estimatedCost != null || item.depositPaid != null) && (
          <p className="text-sm text-slate-500">
            Est. {item.estimatedCost != null ? `R ${item.estimatedCost}` : '–'} · Deposit{' '}
            {item.depositPaid != null ? `R ${item.depositPaid}` : '–'}
            {item.percentageComplete != null && ` · ${item.percentageComplete}%`}
          </p>
        )}
        {item.notes && (
          <p className="mt-1 text-sm text-slate-500">{item.notes}</p>
        )}
      </div>
      {canEdit && (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-200"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      )}
    </li>
  )
}
