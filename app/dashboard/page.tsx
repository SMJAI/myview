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

function timeSunEmoji() {
  const hour = new Date().getUTCHours() + 1
  if (hour < 12) return '🌤️'
  if (hour < 17) return '☀️'
  return '🌙'
}

// Emoji + colored background per leave type name
const LEAVE_TYPE_UI: Record<string, { emoji: string; bg: string }> = {
  'Annual Leave':           { emoji: '🌴', bg: '#dcfce7' },
  'Bank Holiday':           { emoji: '🏛️', bg: '#dbeafe' },
  'Sick Leave':             { emoji: '🩺', bg: '#fce7f3' },
  'Compassionate Leave':    { emoji: '🤍', bg: '#f1f5f9' },
  'Maternity Leave':        { emoji: '🤱', bg: '#fdf4ff' },
  'Paternity Leave':        { emoji: '👶', bg: '#eff6ff' },
  'Shared Parental Leave':  { emoji: '👨‍👩‍👧', bg: '#fefce8' },
  'Adoption Leave':         { emoji: '🏠', bg: '#fff7ed' },
  'Parental Bereavement':   { emoji: '🕊️', bg: '#f1f5f9' },
  'Neonatal Care Leave':    { emoji: '🍼', bg: '#f0fdf4' },
  'Unpaid Parental Leave':  { emoji: '📋', bg: '#f8fafc' },
  'Unpaid Leave':           { emoji: '⏸️', bg: '#f8fafc' },
}

function getLeaveUI(name: string | undefined) {
  if (!name) return { emoji: '📋', bg: '#f1f5f9' }
  return LEAVE_TYPE_UI[name] ?? { emoji: '📋', bg: '#f1f5f9' }
}

function WelcomeBanner({ name }: { name: string }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden px-8 py-9 flex items-center justify-between gap-6"
      style={{ background: 'linear-gradient(130deg, #d1f0e6 0%, #a3e1ce 55%, #7dcbb0 100%)' }}
    >
      {/* Wave shapes */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 55 Q180 5 380 60 T780 30 L780 260 L0 260 Z"
          fill="rgba(255,255,255,0.18)"
        />
        <path
          d="M50 80 Q220 25 450 70 T850 40 L850 260 L50 260 Z"
          fill="rgba(255,255,255,0.1)"
        />
        <ellipse cx="88%" cy="20%" rx="120" ry="80" fill="rgba(255,255,255,0.12)" />
      </svg>

      {/* Text */}
      <div className="relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-green-900/60 mb-1.5">
          {timeGreeting()} {timeSunEmoji()}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-green-950 mb-2">
          {name} 👋
        </h1>
        <p className="text-sm text-green-900/60 leading-relaxed">
          Your health and time matter. Here&apos;s your leave overview.
        </p>
      </div>

      {/* Button + plant */}
      <div className="relative z-10 flex flex-col items-end gap-5 shrink-0">
        <Link
          href="/dashboard/requests/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-green-800 shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4 text-brand-600" />
          New Request
        </Link>
        {/* Inline plant SVG illustration */}
        <svg width="90" height="72" viewBox="0 0 90 72" fill="none" aria-hidden="true" className="opacity-80">
          <ellipse cx="26" cy="38" rx="22" ry="13" fill="#16a34a" transform="rotate(-28 26 38)"/>
          <ellipse cx="63" cy="40" rx="21" ry="12" fill="#22c55e" transform="rotate(22 63 40)"/>
          <ellipse cx="44" cy="25" rx="17" ry="10" fill="#15803d" transform="rotate(-12 44 25)"/>
          <ellipse cx="52" cy="34" rx="13" ry="7" fill="#4ade80" transform="rotate(18 52 34)" opacity="0.8"/>
          <path d="M45 60 Q45 46 45 30" stroke="#166534" strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="29" y="59" width="32" height="5" rx="2.5" fill="#86efac"/>
          <path d="M32 64 L58 64 L55 72 L35 72 Z" fill="#bbf7d0"/>
        </svg>
      </div>
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
              const { emoji, bg } = getLeaveUI(b.leave_types?.name)

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  {/* Icon + name */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: bg }}
                    >
                      {emoji}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: low ? '#ef4444' : color }} />
                      <p className="text-xs font-medium text-gray-700 truncate leading-tight">{b.leave_types?.name}</p>
                    </div>
                  </div>

                  {/* Number + chart */}
                  {b.total_days > 0 ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-3xl font-bold leading-none ${low ? 'text-red-500' : 'text-gray-900'}`}>
                          {remaining}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">of {b.total_days}d left</p>
                        {low && <p className="text-[10px] text-red-400 font-medium mt-0.5">Running low</p>}
                      </div>
                      <DonutChart used={b.used_days} total={b.total_days} color={low ? '#ef4444' : color} size={60} strokeWidth={7} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-gray-900 leading-none">{b.used_days}</p>
                        <p className="text-xs text-gray-400 mt-1">days used</p>
                      </div>
                      <div className="w-[60px] h-[60px] shrink-0 rounded-full border-[7px] border-gray-100 flex items-center justify-center">
                        <span className="text-[9px] text-gray-400 text-center leading-tight">no cap</span>
                      </div>
                    </div>
                  )}

                  {/* View details */}
                  <Link href="/dashboard/balances" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                    View details →
                  </Link>
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
                {(recentRequests as LeaveRequest[]).map((r, i) => {
                  const { emoji, bg } = getLeaveUI(r.leave_types?.name)
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-brand-50/30 transition-colors"
                      style={{ borderBottom: i < recentRequests.length - 1 ? '1px solid #f9fafb' : 'none' }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                            style={{ background: bg }}>
                            {emoji}
                          </div>
                          <span className="font-medium text-gray-900">{r.leave_types?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{formatDateShort(r.start_date)} – {formatDateShort(r.end_date)}</td>
                      <td className="px-5 py-3.5 text-gray-500">{r.days_count}d</td>
                      <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
