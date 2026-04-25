import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/status-badge'
import { formatDate, formatDateShort } from '@/lib/utils'
import { DonutChart } from '@/components/donut-chart'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import type { LeaveBalance, LeaveRequest } from '@/lib/types'

function timeGreeting() {
  const hour = new Date().getUTCHours() + 1
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function WelcomeBanner({ name }: { name: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 text-white px-8 py-7 flex items-center justify-between gap-6">
      <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute bottom-0 right-24 w-36 h-36 rounded-full bg-white/10 translate-y-1/2 pointer-events-none" />
      <div className="relative z-10">
        <h1 className="text-2xl font-bold mb-1">{timeGreeting()}, {name} 👋</h1>
        <p className="text-green-100 text-sm leading-relaxed max-w-md">
          Your health and time matter. Here&apos;s your leave overview — take the rest you deserve.
        </p>
      </div>
      <Link
        href="/dashboard/requests/new"
        className="relative z-10 shrink-0 inline-flex items-center gap-2 bg-white text-brand-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors shadow-sm"
      >
        <PlusCircle className="w-4 h-4" />
        New Request
      </Link>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const currentYear = new Date().getFullYear()

  const [{ data: balances }, { data: recentRequests }, { data: profile }] = await Promise.all([
    supabase
      .from('leave_balances')
      .select('*, leave_types(*)')
      .eq('user_id', user.id)
      .eq('year', currentYear),
    supabase
      .from('leave_requests')
      .select('*, leave_types(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8">

      <WelcomeBanner name={firstName} />

      {/* Balance cards with donut charts */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Leave Balances — {currentYear}
        </h2>
        {!balances || balances.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm">
            No leave balances set up yet. Contact your manager.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(balances as LeaveBalance[]).map((b) => {
              const remaining = b.total_days > 0 ? b.total_days - b.used_days : null
              const low = remaining !== null && remaining <= 2
              const color = b.leave_types?.color ?? '#1F9F70'
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <p className="text-xs font-medium text-gray-600 truncate">{b.leave_types?.name}</p>
                  </div>

                  {b.total_days > 0 ? (
                    <div className="flex items-center gap-3">
                      <DonutChart used={b.used_days} total={b.total_days} color={low ? '#ef4444' : color} />
                      <div>
                        <p className={`text-2xl font-bold ${low ? 'text-red-600' : 'text-gray-900'}`}>
                          {remaining}
                        </p>
                        <p className="text-xs text-gray-500 leading-tight">of {b.total_days}d left</p>
                        {low && <p className="text-[10px] text-red-500 font-medium mt-0.5">Running low</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-[72px] h-[72px] shrink-0 rounded-full border-[9px] border-gray-100 flex items-center justify-center">
                        <span className="text-[10px] text-gray-400 text-center leading-tight">no cap</span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{b.used_days}</p>
                        <p className="text-xs text-gray-500 leading-tight">days used</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Recent Requests</h2>
          <Link href="/dashboard/requests" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {!recentRequests || recentRequests.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm mb-2">No leave requests yet.</p>
              <Link href="/dashboard/requests/new" className="text-sm text-brand-600 hover:underline font-medium">
                Submit your first request →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dates</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Days</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(recentRequests as LeaveRequest[]).map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{r.leave_types?.name}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {formatDateShort(r.start_date)} – {formatDateShort(r.end_date)}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{r.days_count}d</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
