import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BalancesTable } from './balances-table'
import type { Profile, LeaveType, LeaveBalance } from '@/lib/types'
import Link from 'next/link'

export default async function BalancesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager') redirect('/dashboard')

  const currentYear = new Date().getFullYear()
  const selectedYear = currentYear

  const [{ data: employees }, { data: leaveTypes }, { data: balances }] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('leave_types').select('*').order('is_default', { ascending: false }).order('name'),
    supabase.from('leave_balances').select('*, leave_types(*)').eq('year', selectedYear),
  ])

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
        />
      )}
    </div>
  )
}
