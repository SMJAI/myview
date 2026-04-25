import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { LeaveBalance } from '@/lib/types'

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

  const balances = (balancesRaw ?? []).filter(b => b.leave_types?.show_in_balances !== false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Leave Balances</h1>
        <p className="text-gray-500 text-sm mt-1">Your entitlements for {year}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!balances || balances.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No leave balances have been set up yet. Contact HR.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Leave Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entitlement</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Used</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Remaining</th>
                <th className="px-5 py-3 w-48" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(balances as LeaveBalance[]).map((b) => {
                const remaining = b.total_days - b.used_days
                const pct = b.total_days > 0 ? Math.min((b.used_days / b.total_days) * 100, 100) : 0
                const low = b.total_days > 0 && remaining <= 2

                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: b.leave_types?.color ?? '#6B7280' }}
                        />
                        <span className="font-medium text-gray-900">{b.leave_types?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {b.total_days > 0 ? `${b.total_days} days` : <span className="text-gray-400 italic">uncapped</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{b.used_days > 0 ? `${b.used_days} days` : '—'}</td>
                    <td className="px-5 py-3.5">
                      {b.total_days > 0 ? (
                        <span className={`font-medium ${low ? 'text-red-600' : 'text-gray-900'}`}>
                          {remaining} days{low && ' ⚠'}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {b.total_days > 0 && (
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${low ? 'bg-red-400' : 'bg-brand-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
