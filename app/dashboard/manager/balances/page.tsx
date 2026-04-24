import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile, LeaveBalance, LeaveType } from '@/lib/types'

export default async function TeamBalancesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['manager', 'hr_admin'].includes(profile.role)) redirect('/dashboard')

  const year = new Date().getFullYear()

  const [{ data: employees }, { data: leaveTypes }, { data: balances }] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('leave_types').select('*').eq('is_default', true).order('name'),
    supabase.from('leave_balances').select('*, leave_types(*)').eq('year', year),
  ])

  const empList = (employees ?? []) as Profile[]
  const typeList = (leaveTypes ?? []) as LeaveType[]
  const balList = (balances ?? []) as LeaveBalance[]

  function getBalance(userId: string, leaveTypeId: string) {
    return balList.find(b => b.user_id === userId && b.leave_type_id === leaveTypeId)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Leave Balances</h1>
        <p className="text-gray-500 text-sm mt-1">Default entitlements for all team members — {year}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50">
                Employee
              </th>
              {typeList.map(lt => (
                <th key={lt.id} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center whitespace-nowrap">
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: lt.color }} />
                    {lt.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {empList.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5 sticky left-0 bg-white">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-xs shrink-0">
                      {emp.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 whitespace-nowrap">{emp.full_name}</p>
                      {emp.weekly_hours && emp.weekly_hours !== 37.5 && (
                        <p className="text-xs text-gray-400">{emp.weekly_hours}h/wk</p>
                      )}
                    </div>
                  </div>
                </td>
                {typeList.map(lt => {
                  const bal = getBalance(emp.id, lt.id)
                  const remaining = bal ? bal.total_days - bal.used_days : null
                  const low = remaining !== null && bal!.total_days > 0 && remaining <= 2

                  return (
                    <td key={lt.id} className="px-4 py-3.5 text-center">
                      {bal ? (
                        <div>
                          <span className={`font-medium ${low ? 'text-red-600' : 'text-gray-900'}`}>
                            {remaining}
                          </span>
                          <span className="text-gray-400 text-xs"> / {bal.total_days}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Showing remaining / entitlement days. To edit entitlements go to{' '}
        <a href="/dashboard/admin/balances" className="text-brand-600 hover:underline">Leave Balances</a>.
      </p>
    </div>
  )
}
