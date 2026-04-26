import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BalancesTable } from './balances-table'
import { getEnglandBankHolidays } from '@/lib/bank-holidays'
import { proratedBankHolidays, prorateEntitlement } from '@/lib/proration'
import type { Profile, LeaveType, LeaveBalance } from '@/lib/types'
import { canManageUsers } from '@/lib/types'
import Link from 'next/link'

export default async function BalancesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !canManageUsers(profile.role)) redirect('/dashboard')

  const currentYear = new Date().getFullYear()
  const selectedYear = currentYear

  const [{ data: employees }, { data: leaveTypes }, bankHolidays] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('leave_types').select('*').eq('show_in_balances', true).order('name'),
    getEnglandBankHolidays(),
  ])

  // Auto-seed missing default balances for employees who have a start date
  const admin = createAdminClient()
  const { data: existingBalances } = await admin
    .from('leave_balances').select('user_id, leave_type_id').eq('year', selectedYear)

  const defaultTypes = ((leaveTypes ?? []) as LeaveType[]).filter(lt => lt.is_default)
  const toInsert: { user_id: string; leave_type_id: string; year: number; total_days: number; used_days: number }[] = []

  for (const emp of (employees ?? []) as Profile[]) {
    if (!emp.start_date) continue
    for (const lt of defaultTypes) {
      if ((existingBalances ?? []).some(b => b.user_id === emp.id && b.leave_type_id === lt.id)) continue
      const totalDays = lt.name === 'Bank Holiday'
        ? proratedBankHolidays(bankHolidays, emp.start_date, selectedYear)
        : prorateEntitlement(lt.default_days, emp.start_date, selectedYear, emp.weekly_hours ?? 37.5)
      toInsert.push({ user_id: emp.id, leave_type_id: lt.id, year: selectedYear, total_days: totalDays, used_days: 0 })
    }
  }
  if (toInsert.length > 0) await admin.from('leave_balances').insert(toInsert)

  // Fetch balances fresh (after potential auto-seed above)
  const { data: balances } = await admin
    .from('leave_balances').select('*, leave_types(*)').eq('year', selectedYear)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Balances</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage entitlements for all employees — {selectedYear}
          </p>
        </div>
        <Link
          href="/dashboard/admin"
          className="text-sm text-brand-600 hover:underline"
        >
          ← Back to Users
        </Link>
      </div>

      {!employees || employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          No employees yet.{' '}
          <Link href="/dashboard/admin" className="text-brand-600 hover:underline">
            Add users first
          </Link>
        </div>
      ) : (
        <BalancesTable
          employees={employees as Profile[]}
          leaveTypes={(leaveTypes ?? []) as LeaveType[]}
          balances={(balances ?? []) as LeaveBalance[]}
          year={selectedYear}
          bankHolidays={bankHolidays}
        />
      )}
    </div>
  )
}
