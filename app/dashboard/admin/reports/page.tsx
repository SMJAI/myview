import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canManageUsers } from '@/lib/types'
import { ReportFilters } from './report-filters'
import { StatusBadge } from '@/components/status-badge'
import { formatDate } from '@/lib/utils'
import type { Profile, LeaveType, LeaveRequest, LeaveBalance } from '@/lib/types'

interface Props {
  searchParams: Promise<Record<string, string>>
}

export default async function ReportsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !canManageUsers(profile.role)) redirect('/dashboard')

  const sp = await searchParams
  const year = new Date().getFullYear()

  const report   = sp.report   ?? 'requests'
  const typeId   = sp.type     ?? 'all'
  const empId    = sp.employee ?? 'all'
  const from     = sp.from     ?? `${year}-01-01`
  const to       = sp.to       ?? `${year}-12-31`

  const [{ data: leaveTypes }, { data: employees }] = await Promise.all([
    supabase.from('leave_types').select('*').order('name'),
    supabase.from('profiles').select('*').order('full_name'),
  ])

  // ── Fetch report data ────────────────────────────────────────────────
  let requestRows: LeaveRequest[] = []
  let balanceRows: (LeaveBalance & { profiles?: Profile })[] = []

  if (report === 'requests') {
    let q = supabase
      .from('leave_requests')
      .select('*, profiles(*), leave_types(*)')
      .gte('start_date', from)
      .lte('end_date', to)
      .order('start_date', { ascending: false })

    if (typeId !== 'all') q = q.eq('leave_type_id', typeId)
    if (empId !== 'all')  q = q.eq('user_id', empId)

    const { data } = await q
    requestRows = (data ?? []) as LeaveRequest[]
  } else {
    let q = supabase
      .from('leave_balances')
      .select('*, profiles(*), leave_types(*)')
      .eq('year', year)

    if (typeId !== 'all') q = q.eq('leave_type_id', typeId)
    if (empId !== 'all')  q = q.eq('user_id', empId)

    const { data } = await q
    balanceRows = (data ?? []) as (LeaveBalance & { profiles?: Profile })[]
    balanceRows.sort((a, b) =>
      (a.profiles?.full_name ?? '').localeCompare(b.profiles?.full_name ?? '')
    )
  }

  const filters = { report, type: typeId, from, to, employee: empId }
  const totalDays = requestRows.reduce((sum, r) => sum + r.days_count, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          Filter, preview and export leave data
        </p>
      </div>

      <ReportFilters
        leaveTypes={(leaveTypes ?? []) as LeaveType[]}
        employees={(employees ?? []) as Profile[]}
        filters={filters}
        requestRows={requestRows}
        balanceRows={balanceRows as (LeaveBalance & { profiles?: Profile })[]}
      />

      {/* Results */}
      {report === 'requests' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-900">{requestRows.length}</span> request{requestRows.length !== 1 ? 's' : ''}
              {requestRows.length > 0 && (
                <span> · <span className="font-medium text-gray-900">{totalDays}</span> total days</span>
              )}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {requestRows.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No requests match these filters.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Leave Type</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">From</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">To</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Days</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requestRows.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold shrink-0">
                            {r.profiles?.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{r.profiles?.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{r.leave_types?.name}</td>
                      <td className="px-5 py-3.5 text-gray-600">{formatDate(r.start_date)}</td>
                      <td className="px-5 py-3.5 text-gray-600">{formatDate(r.end_date)}</td>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{r.days_count}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3.5 text-gray-400">{r.created_at.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">{balanceRows.length}</span> balance record{balanceRows.length !== 1 ? 's' : ''} — {year}
          </p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {balanceRows.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No balances match these filters.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Leave Type</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entitlement</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Used</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {balanceRows.map(b => {
                    const remaining = b.total_days - b.used_days
                    const low = b.total_days > 0 && remaining <= 2
                    return (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold shrink-0">
                              {b.profiles?.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{b.profiles?.full_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.leave_types?.color }} />
                            {b.leave_types?.name}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-700">
                          {b.total_days > 0 ? `${b.total_days}d` : <span className="text-gray-400 italic">uncapped</span>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">{b.used_days > 0 ? `${b.used_days}d` : '—'}</td>
                        <td className="px-5 py-3.5">
                          {b.total_days > 0 ? (
                            <span className={`font-medium ${low ? 'text-red-600' : 'text-gray-900'}`}>
                              {remaining}d
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
