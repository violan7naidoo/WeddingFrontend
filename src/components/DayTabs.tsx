import type { WeddingDay } from '../types/api'

type Props = {
  days: WeddingDay[]
  selectedDayId: number | null
  onSelect: (id: number) => void
}

export default function DayTabs({ days, selectedDayId, onSelect }: Props) {
  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {days.map((day) => (
        <button
          key={day.id}
          type="button"
          onClick={() => onSelect(day.id)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedDayId === day.id
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {day.themeName}
        </button>
      ))}
    </div>
  )
}
