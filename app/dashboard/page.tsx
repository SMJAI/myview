import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/status-badge'
import { formatDateShort } from '@/lib/utils'
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
    <div
      className="relative rounded-2xl overflow-hidden text-white px-8 py-8 flex items-center justify-between gap-6"
      style={{ background: 'linear-gradient(135deg, #041f14 0%, #065c3d 45%, #1f9f70 100%)' }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* Glow orb */}
      <div
        className="absolute right-0 top-0 bottom-0 w-96 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at right center, rgba(110,231,183,0.2) 0%, transparent 70%)' }}
      />
      {/* Large circle accent */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="absolute -bottom-10 right-36 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.04)' }} />

      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(167,243,208,0.7)' }}>
          {timeGreeting()}
        </p>
        <h1 className="text-3xl font-bold mb-1.5 tracking-tight">{name} 👋</h1>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(167,243,208,0.8)' }}>
          Your health and time matter. Here&apos;s your leave overview.
        </p>
      </div>

      <Link
        href="/dashboard/requests/new"
        className="relative z-10 shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.25)',
          backdropFilter: 'blur(8px)',
          color: 'white',
        }}
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
    supabase.from('leave_balances').select('*, leave_types(*)').eq('user_id', user.id).eq('year', currentYear),
    supabase.from('leave_requests').select('*, leave_types(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8">

      <WelcomeBanner name={firstName} />

      {/* Leave balances */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Leave Balances — {currentYear}
        </h2>
        {!balances || balances.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-500 text-sm shadow-sm">
            No leave balances set up yet. Contact your manager.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(balances as LeaveBalance[]).map((b) => {
              const remaining = b.total_days > 0 ? b.total_days - b.used_days : null
              const low = remaining !== null && remaining <= 2
              const color = b.leave_types?.color ?? '#1F9F70'
              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl p-5 flex flex-col transition-shadow hover:shadow-md"
                  style={{
                    borderTop: `3px solid ${low ? '#ef4444' : color}`,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: low ? '#ef4444' : color }} />
                    <p className="text-xs font-medium text-gray-600 truncate">{b.leave_types?.name}</p>
                  </div>

                  {b.total_days > 0 ? (
                    <div className="flex items-center gap-3">
                      <DonutChart used={b.used_days} total={b.total_days} color={low ? '#ef4444' : color} />
                      <div>
                        <p className={`text-2xl font-bold ${low ? 'text-red-500' : 'text-gray-900'}`}>{remaining}</p>
                        <p className="text-xs text-gray-400 leading-tight">of {b.total_days}d left</p>
                        {low && <p className="text-[10px] text-red-400 font-medium mt-0.5">Running low</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-[72px] h-[72px] shrink-0 rounded-full border-[9px] border-gray-100 flex items-center justify-center">
                        <span className="text-[10px] text-gray-400 text-center leading-tight">no cap</span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{b.used_days}</p>
                        <p className="text-xs text-gray-400 leading-tight">days used</p>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Recent Requests</h2>
          <Link href="/dashboard/requests" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {!recentRequests || recentRequests.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                <PlusCircle className="w-5 h-5 text-brand-500" />
              </div>
              <p className="text-gray-500 text-sm mb-2">No leave requests yet.</p>
              <Link href="/dashboard/requests/new" className="text-sm text-brand-600 hover:underline font-medium">
                Submit your first request →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Dates</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Days</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {(recentRequests as LeaveRequest[]).map((r, i) => (
                  <tr
                    key={r.id}
                    className="hover:bg-brand-50/40 transition-colors"
                    style={{ borderBottom: i < recentRequests.length - 1 ? '1px solid #f9fafb' : 'none' }}
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900">{r.leave_types?.name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDateShort(r.start_date)} – {formatDateShort(r.end_date)}</td>
                    <td className="px-5 py-3.5 text-gray-500">{r.days_count}d</td>
                    <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
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
