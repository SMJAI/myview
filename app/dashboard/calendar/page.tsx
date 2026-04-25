import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarGrid } from './calendar-grid'
import type { LeaveRequest } from '@/lib/types'

interface Props {
  searchParams: Promise<Record<string, string>>
}

export default async function CalendarPage({ searchParams }: Props) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const now = new Date()
  const [yearStr, monthStr] = (sp.month ?? '').split('-')
  const year  = yearStr  ? parseInt(yearStr)  : now.getFullYear()
  const month = monthStr ? parseInt(monthStr) - 1 : now.getMonth()

  const firstDay = new Date(year, month, 1).toISOString().split('T')[0]
  const lastDay  = new Date(year, month + 1, 0).toISOString().split('T')[0]

  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*, profiles(*), leave_types(*)')
    .eq('status', 'approved')
    .lte('start_date', lastDay)
    .gte('end_date', firstDay)
    .order('start_date')

  // Build ISO-date → requests map for every day of each approved leave
  const dayMap: Record<string, LeaveRequest[]> = {}
  for (const r of (requests ?? []) as LeaveRequest[]) {
    const start = new Date(r.start_date)
    const end   = new Date(r.end_date)
    const cur   = new Date(start)
    while (cur <= end) {
      const iso = cur.toISOString().split('T')[0]
      if (!dayMap[iso]) dayMap[iso] = []
      dayMap[iso].push(r)
      cur.setDate(cur.getDate() + 1)
    }
  }

  const uniquePeople = Array.from(
    new Map((requests ?? []).map((r: LeaveRequest) => [r.user_id, r.profiles])).values()
  ).filter(Boolean)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Calendar</h1>
        <p className="text-gray-500 text-sm mt-1">Approved absences across the team</p>
      </div>

      <CalendarGrid year={year} month={month} dayMap={dayMap} />

      {uniquePeople.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-1">
          <span className="text-xs text-gray-400 uppercase font-semibold tracking-wide self-center mr-2">On leave this month:</span>
          {uniquePeople.map((p: any) => (
            <div key={p.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-sm text-gray-700">
              <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-[10px] shrink-0">
                {p.full_name?.charAt(0).toUpperCase()}
              </div>
              {p.full_name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
