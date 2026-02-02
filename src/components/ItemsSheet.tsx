import { memo, useMemo, useState } from 'react'
import type { CategoryDto, WeddingItemDto } from '../types/api'
import { fetchWithAuth } from '../api/client'
import AddItemForm from './AddItemForm'

type Props = {
  categories: CategoryDto[]
  items: WeddingItemDto[]
  canEdit: boolean
  token: string
  onAddItem: (category: CategoryDto) => void
  onUpdatedOrDeleted: () => void
  searchQuery: string
}

function formatZar(value: number | null | undefined) {
  if (value == null) return '–'
  try {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value)
  } catch {
    return `R ${value.toFixed(2)}`
  }
}

function formatPercent(value: number | null | undefined) {
  if (value == null) return '–'
  return `${value}%`
}

const ItemsSheet = memo(function ItemsSheet({
  categories,
  items,
  canEdit,
  token,
  onAddItem,
  onUpdatedOrDeleted,
  searchQuery,
}: Props) {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return items
    return items.filter((i) => {
      const haystack = [
        i.name,
        i.vendorName ?? '',
        i.notes ?? '',
        i.categoryName ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [items, normalizedQuery])

  const itemsByCategory = useMemo(() => {
    const map = new Map<number, WeddingItemDto[]>()
    for (const item of filteredItems) {
      const list = map.get(item.categoryId) ?? []
      list.push(item)
      map.set(item.categoryId, list)
    }
    // stable-ish ordering
    for (const [, list] of map) list.sort((a, b) => a.name.localeCompare(b.name))
    return map
  }, [filteredItems])

  return (
    <div className="space-y-8">
      {categories.map((cat) => {
        const categoryItems = itemsByCategory.get(cat.id) ?? []
        const totals = categoryItems.reduce(
          (acc, it) => {
            acc.estimated += it.estimatedCost ?? 0
            acc.deposit += it.depositPaid ?? 0
            acc.outstanding += it.outstandingFees ?? 0
            return acc
          },
          { estimated: 0, deposit: 0, outstanding: 0 }
        )

        return (
          <section
            key={cat.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-rose-50 to-amber-50 px-4 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-900">{cat.name}</h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  Totals: {formatZar(totals.estimated)} est · {formatZar(totals.deposit)} deposit ·{' '}
                  {formatZar(totals.outstanding)} outstanding
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onAddItem(cat)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  Add row
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-separate border-spacing-0 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      'Item',
                      'Vendor',
                      'Est. (R)',
                      'Deposit (R)',
                      'Outstanding (R)',
                      '%',
                      'Notes',
                      'Actions',
                    ].map((h) => (
                      <th
                        key={h}
                        className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categoryItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-6 text-sm text-slate-500"
                      >
                        No rows yet.
                      </td>
                    </tr>
                  ) : (
                    categoryItems.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        canEdit={canEdit}
                        token={token}
                        onUpdatedOrDeleted={onUpdatedOrDeleted}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
})

function ItemRow({
  item,
  canEdit,
  token,
  onUpdatedOrDeleted,
}: {
  item: WeddingItemDto
  canEdit: boolean
  token: string
  onUpdatedOrDeleted: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this row?')) return
    setDeleting(true)
    try {
      const res = await fetchWithAuth(`/api/wedding/items/${item.id}`, {
        method: 'DELETE',
        token,
      })
      if (res.ok) onUpdatedOrDeleted()
      else throw new Error(await res.text())
    } finally {
      setDeleting(false)
    }
  }

  if (editing) {
    return (
      <AddItemForm
        dayId={item.dayId}
        category={{ id: item.categoryId, name: item.categoryName, displayOrder: 0 }}
        token={token}
        existingItem={item}
        onClose={() => setEditing(false)}
        onCreated={onUpdatedOrDeleted}
      />
    )
  }

  return (
    <tr className="group hover:bg-rose-50/40">
      <td className="border-b border-slate-200 px-3 py-2 align-top font-medium text-slate-900">
        {item.name}
      </td>
      <td className="border-b border-slate-200 px-3 py-2 align-top text-slate-700">
        {item.vendorName ?? '–'}
      </td>
      <td className="border-b border-slate-200 px-3 py-2 align-top text-slate-700">
        {formatZar(item.estimatedCost)}
      </td>
      <td className="border-b border-slate-200 px-3 py-2 align-top text-slate-700">
        {formatZar(item.depositPaid)}
      </td>
      <td className="border-b border-slate-200 px-3 py-2 align-top text-slate-700">
        {formatZar(item.outstandingFees)}
      </td>
      <td className="border-b border-slate-200 px-3 py-2 align-top text-slate-700">
        {formatPercent(item.percentageComplete)}
      </td>
      <td className="border-b border-slate-200 px-3 py-2 align-top text-slate-600">
        <span className="block max-w-[360px] truncate">{item.notes ?? '–'}</span>
      </td>
      <td className="border-b border-slate-200 px-3 py-2 align-top">
        {canEdit ? (
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? '…' : 'Delete'}
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
    </tr>
  )
}

export default ItemsSheet

