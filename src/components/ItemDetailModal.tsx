import { useRef, useState } from 'react'
import type { WeddingItemDto, PaymentDto } from '../types/api'
import { weddingApi } from '../api/weddingApi'
import AddItemForm from './AddItemForm'

type Props = {
  item: WeddingItemDto
  canEdit: boolean
  token: string
  onClose: () => void
  onUpdated: (updated: WeddingItemDto) => void
}

function formatZar(value: number | null | undefined) {
  if (value == null) return '–'
  try {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value)
  } catch {
    return `R ${value.toFixed(2)}`
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-ZA', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return iso
  }
}

async function resizeImage(file: File, maxPx = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ItemDetailModal({ item: initialItem, canEdit, token, onClose, onUpdated }: Props) {
  const [item, setItem] = useState(initialItem)
  const [editing, setEditing] = useState(false)
  const [addingPayment, setAddingPayment] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payNote, setPayNote] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)
  const [deletingPaymentId, setDeletingPaymentId] = useState<number | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deletingImageIndex, setDeletingImageIndex] = useState<number | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalPaid = (item.depositPaid ?? 0) + item.payments.reduce((s, p) => s + p.amount, 0)

  function syncItem(updated: WeddingItemDto) {
    setItem(updated)
    onUpdated(updated)
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0) return
    setSavingPayment(true)
    try {
      const updated = await weddingApi.payments.add(item.id, { amount, paidDate: payDate, note: payNote || null }, token)
      syncItem(updated)
      setPayAmount('')
      setPayNote('')
      setPayDate(new Date().toISOString().slice(0, 10))
      setAddingPayment(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to add payment')
    } finally {
      setSavingPayment(false)
    }
  }

  async function handleDeletePayment(payment: PaymentDto) {
    if (!confirm('Remove this payment?')) return
    setDeletingPaymentId(payment.id)
    try {
      const updated = await weddingApi.payments.delete(item.id, payment.id, token)
      syncItem(updated)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete payment')
    } finally {
      setDeletingPaymentId(null)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const base64 = await resizeImage(file)
      const updated = await weddingApi.images.add(item.id, base64, token)
      syncItem(updated)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to upload image')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeleteImage(index: number) {
    if (!confirm('Remove this photo?')) return
    setDeletingImageIndex(index)
    try {
      const updated = await weddingApi.images.delete(item.id, index, token)
      syncItem(updated)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete image')
    } finally {
      setDeletingImageIndex(null)
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
        onCreated={() => {
          setEditing(false)
          onClose()
        }}
      />
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-rose-50 to-amber-50 px-6 py-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-rose-600">{item.categoryName}</p>
              <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{item.name}</h2>
              {item.vendorName && <p className="mt-0.5 text-sm text-slate-600">{item.vendorName}</p>}
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit details
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Cost summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Est. Cost', value: formatZar(item.estimatedCost) },
                { label: 'Deposit Paid', value: formatZar(item.depositPaid) },
                { label: 'Total Paid', value: formatZar(totalPaid) },
                { label: 'Outstanding', value: formatZar(item.outstandingFees), highlight: (item.outstandingFees ?? 0) > 0 },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className={`mt-0.5 text-sm font-semibold ${highlight ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p>
                </div>
              ))}
            </div>

            {(item.percentageComplete != null || item.notes) && (
              <div className="space-y-2">
                {item.percentageComplete != null && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-24 shrink-0">% Complete</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-slate-200 h-2">
                      <div
                        className="h-2 rounded-full bg-rose-400 transition-all"
                        style={{ width: `${Math.min(100, item.percentageComplete)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 w-8 text-right">{item.percentageComplete}%</span>
                  </div>
                )}
                {item.notes && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-xs text-slate-500">Notes</p>
                    <p className="mt-0.5 text-sm text-slate-700 whitespace-pre-wrap">{item.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Payments */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Payment history</h3>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setAddingPayment((v) => !v)}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                  >
                    {addingPayment ? 'Cancel' : '+ Add payment'}
                  </button>
                )}
              </div>

              {addingPayment && (
                <form onSubmit={handleAddPayment} className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Amount (R)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
                      <input
                        type="date"
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Note (optional)</label>
                    <input
                      type="text"
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                      placeholder="e.g. 2nd installment"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingPayment}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50"
                  >
                    {savingPayment ? 'Saving…' : 'Save payment'}
                  </button>
                </form>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-1.5 text-xs font-semibold text-slate-500">Date</th>
                    <th className="pb-1.5 text-xs font-semibold text-slate-500">Amount</th>
                    <th className="pb-1.5 text-xs font-semibold text-slate-500">Note</th>
                    {canEdit && <th className="pb-1.5" />}
                  </tr>
                </thead>
                <tbody>
                  {item.depositPaid != null && item.depositPaid > 0 && (
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 text-slate-600">–</td>
                      <td className="py-1.5 font-medium text-slate-800">{formatZar(item.depositPaid)}</td>
                      <td className="py-1.5 text-slate-500">Deposit</td>
                      {canEdit && <td />}
                    </tr>
                  )}
                  {item.payments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-1.5 text-slate-600">{formatDate(p.paidDate)}</td>
                      <td className="py-1.5 font-medium text-slate-800">{formatZar(p.amount)}</td>
                      <td className="py-1.5 text-slate-500">{p.note ?? '–'}</td>
                      {canEdit && (
                        <td className="py-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(p)}
                            disabled={deletingPaymentId === p.id}
                            className="text-xs text-red-600 hover:underline disabled:opacity-50"
                          >
                            {deletingPaymentId === p.id ? '…' : 'Remove'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {item.depositPaid == null && item.payments.length === 0 && (
                    <tr>
                      <td colSpan={canEdit ? 4 : 3} className="py-3 text-sm text-slate-400">No payments recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Photos */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Photos</h3>
                {canEdit && item.images.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {uploadingImage ? 'Uploading…' : '+ Add photo'}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {item.images.length === 0 ? (
                <p className="text-sm text-slate-400">No photos yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {item.images.map((src, i) => (
                    <div key={i} className="group relative overflow-hidden rounded-xl border border-slate-200">
                      <img
                        src={src}
                        alt=""
                        className="h-28 w-full cursor-pointer object-cover transition-opacity hover:opacity-90"
                        onClick={() => setViewingImage(src)}
                      />
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(i)}
                          disabled={deletingImageIndex === i}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 disabled:opacity-50"
                        >
                          {deletingImageIndex === i ? '…' : '×'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Full-screen image viewer */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setViewingImage(null)}
        >
          <img src={viewingImage} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  )
}
