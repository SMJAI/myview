'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { LeaveRequest } from '@/lib/types'

interface CalendarGridProps {
  year: number
  month: number // 0-indexed
  dayMap: Record<string, LeaveRequest[]>
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstWeekday(year: number, month: number) {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1 // Mon=0 … Sun=6
}

export function CalendarGrid({ year, month, dayMap }: CalendarGridProps) {
  const router = useRouter()
  const pathname = usePathname()

  function navigate(delta: number) {
    const d = new Date(year, month + delta, 1)
    router.push(`${pathname}?month=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const daysInMonth = getDaysInMonth(year, month)
  const firstWeekday = getFirstWeekday(year, month)
  const todayStr = new Date().toISOString().split('T')[0]

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header with navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">{monthLabel}</h2>
        <button
          onClick={() => navigate(1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headings */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold text-gray-400 uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-24 border-b border-r border-gray-50 last:border-r-0" />

          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const events = dayMap[iso] ?? []
          const isToday = iso === todayStr
          const isWeekend = (i % 7) >= 5

          return (
            <div
              key={i}
              className={`h-24 p-1.5 border-b border-r border-gray-100 last:border-r-0 flex flex-col ${isWeekend ? 'bg-gray-50/60' : ''}`}
            >
              <span
                className={`text-xs font-medium self-start w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  isToday
                    ? 'bg-brand-600 text-white'
                    : isWeekend
                    ? 'text-gray-400'
                    : 'text-gray-700'
                }`}
              >
                {day}
              </span>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {events.slice(0, 3).map((r, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium text-white truncate"
                    style={{ backgroundColor: r.leave_types?.color ?? '#1F9F70' }}
                    title={`${r.profiles?.full_name} — ${r.leave_types?.name}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white/30 flex items-center justify-center text-[8px] shrink-0 font-bold">
                      {r.profiles?.full_name?.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{r.profiles?.full_name?.split(' ')[0]}</span>
                  </div>
                ))}
                {events.length > 3 && (
                  <span className="text-[10px] text-gray-400 pl-1">+{events.length - 3} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
