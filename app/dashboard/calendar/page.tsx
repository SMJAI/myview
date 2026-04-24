import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import type { LeaveRequest } from '@/lib/types'

export default async function CalendarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 3, 0).toISOString().split('T')[0]

  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*, profiles(*), leave_types(*)')
    .eq('status', 'approved')
    .gte('end_date', startOfMonth)
    .lte('start_date', endOfMonth)
    .order('start_date', { ascending: true })

  // Group by month
  const grouped: Record<string, LeaveRequest[]> = {}
  for (const r of (requests ?? []) as LeaveRequest[]) {
    const month = new Date(r.start_date).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    })
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(r)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Calendar</h1>
        <p className="text-gray-500 text-sm mt-1">Approved absences for the next 3 months</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          No approved absences in the coming months.
        </div>
      ) : (
        Object.entries(grouped).map(([month, items]) => (
          <div key={month}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{month}</h2>
            <div className="space-y-2">
              {items.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4"
                >
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: r.leave_types?.color ?? '#6B7280' }}
                  />
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
                    {r.profiles?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{r.profiles?.full_name}</p>
                    <p className="text-xs text-gray-500">{r.leave_types?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700">
                      {formatDate(r.start_date)} – {formatDate(r.end_date)}
                    </p>
                    <p className="text-xs text-gray-500">{r.days_count} day{r.days_count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
