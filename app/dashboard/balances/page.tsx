import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DonutChart } from '@/components/donut-chart'
import type { LeaveBalance } from '@/lib/types'

const LEAVE_TYPE_UI: Record<string, { emoji: string; bg: string }> = {
  'Annual Leave':        { emoji: '🌴', bg: '#dcfce7' },
  'Bank Holiday':        { emoji: '🏛️', bg: '#dbeafe' },
  'Sick Leave':          { emoji: '🩺', bg: '#fce7f3' },
  'Compassionate Leave': { emoji: '🤍', bg: '#f1f5f9' },
  'Maternity Leave':     { emoji: '🤱', bg: '#fdf4ff' },
  'Paternity Leave':     { emoji: '👶', bg: '#eff6ff' },
  'Shared Parental Leave': { emoji: '👨‍👩‍👧', bg: '#fefce8' },
  'Adoption Leave':      { emoji: '🏠', bg: '#fff7ed' },
  'Parental Bereavement': { emoji: '🕊️', bg: '#f1f5f9' },
  'Neonatal Care Leave': { emoji: '🍼', bg: '#f0fdf4' },
  'Unpaid Parental Leave': { emoji: '📋', bg: '#f8fafc' },
  'Unpaid Leave':        { emoji: '⏸️', bg: '#f8fafc' },
}

function getLeaveUI(name: string | undefined) {
  if (!name) return { emoji: '📋', bg: '#f1f5f9' }
  return LEAVE_TYPE_UI[name] ?? { emoji: '📋', bg: '#f1f5f9' }
}

export default async function MyBalancesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const year = new Date().getFullYear()

  const { data: balancesRaw } = await supabase
    .from('leave_balances')
    .select('*, leave_types(*)')
    .eq('user_id', user.id)
    .eq('year', year)
    .order('leave_types(name)')

  const balances = (balancesRaw ?? []).filter(b => b.leave_types?.show_in_balances !== false) as LeaveBalance[]
  const cappedBalances = balances.filter(b => b.total_days > 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Leave Balances</h1>
        <p className="text-gray-500 text-sm mt-1">Your entitlements for {year}</p>
      </div>

      {balances.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 text-sm shadow-sm">
          No leave balances have been set up yet. Contact HR.
        </div>
      ) : (
        <>
          {/* Balance tiles */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {balances.map((b) => {
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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: bg }}>
                      {emoji}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{b.leave_types?.name}</p>
                  </div>

                  {/* Donut + numbers */}
                  {b.total_days > 0 ? (
                    <div className="flex items-center gap-4">
                      <DonutChart used={b.used_days} total={b.total_days} color={low ? '#ef4444' : color} size={64} strokeWidth={8} />
                      <div>
                        <p className={`text-3xl font-bold leading-none ${low ? 'text-red-500' : 'text-gray-900'}`}>
                          {remaining}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">of {b.total_days}d left</p>
                        {b.used_days > 0 && (
                          <p className="text-xs text-gray-400">{b.used_days}d used</p>
                        )}
                        {low && <p className="text-[10px] text-red-400 font-semibold mt-0.5">Running low</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-[64px] h-[64px] shrink-0 rounded-full border-[8px] border-gray-100 flex items-center justify-center">
                        <span className="text-[9px] text-gray-400 text-center leading-tight">no cap</span>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900 leading-none">{b.used_days}</p>
                        <p className="text-xs text-gray-400 mt-1">days used</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Usage breakdown chart */}
          {cappedBalances.length > 0 && (
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <h2 className="text-sm font-semibold text-gray-700 mb-5">Usage Breakdown</h2>
              <div className="space-y-4">
                {cappedBalances.map((b) => {
                  const remaining = b.total_days - b.used_days
                  const usedPct = Math.min((b.used_days / b.total_days) * 100, 100)
                  const low = remaining <= 2
                  const color = b.leave_types?.color ?? '#1F9F70'
                  const { emoji } = getLeaveUI(b.leave_types?.name)

                  return (
                    <div key={b.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{emoji}</span>
                          <span className="text-sm font-medium text-gray-700">{b.leave_types?.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>
                            <span className={`font-semibold ${low ? 'text-red-500' : 'text-gray-800'}`}>{remaining}</span>
                            /{b.total_days}d left
                          </span>
                          {b.used_days > 0 && (
                            <span className="text-gray-400">{b.used_days}d used</span>
                          )}
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${usedPct}%`,
                            backgroundColor: low ? '#ef4444' : color,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
