import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/status-badge'
import { formatDate, formatDateShort } from '@/lib/utils'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import type { LeaveBalance, LeaveRequest } from '@/lib/types'

function timeGreeting() {
  const hour = new Date().getUTCHours() + 1 // approximate UK time (UTC+1 BST)
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function WelcomeBanner({ name }: { name: string }) {
  const greeting = timeGreeting()
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand-600 to-brand-500 text-white px-8 py-6 flex items-center justify-between">
      {/* Decorative circles */}
      <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-white/10 translate-y-1/2 pointer-events-none" />

      <div className="relative z-10">
        <h1 className="text-2xl font-bold mb-1">{greeting}, {name} 👋</h1>
        <p className="text-green-100 text-sm max-w-sm leading-relaxed">
          Your health and time matter. Here&apos;s a look at your leave for this year — take the rest you deserve.
        </p>
      </div>

      <Link
        href="/dashboard/requests/new"
        className="relative z-10 shrink-0 inline-flex items-center gap-2 bg-white text-brand-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors shadow-sm ml-6"
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

      {/* Balance cards */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Your Leave Balances — {currentYear}</h2>
        {!balances || balances.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm">
            No leave balances set up yet. Contact your manager.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(balances as LeaveBalance[]).map((b) => {
              const remaining = b.total_days - b.used_days
              const pct = b.total_days > 0 ? (b.used_days / b.total_days) * 100 : 0
              const low = b.total_days > 0 && remaining <= 2
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.leave_types?.color ?? '#6B7280' }}
                    />
                    <p className="text-xs font-medium text-gray-600 truncate">{b.leave_types?.name}</p>
                  </div>
                  <p className={`text-3xl font-bold ${low ? 'text-red-600' : 'text-gray-900'}`}>{remaining}</p>
                  <p className="text-xs text-gray-500 mt-0.5">of {b.total_days} days remaining</p>
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${low ? 'bg-red-400' : 'bg-brand-500'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
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
                    <td className="px-5 py-3">
                      <StatusBadge status={r.status} />
                    </td>
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
