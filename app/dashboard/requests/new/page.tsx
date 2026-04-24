import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewRequestForm } from './form'
import { getEnglandBankHolidays } from '@/lib/bank-holidays'
import type { LeaveType, LeaveBalance } from '@/lib/types'

export default async function NewRequestPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const currentYear = new Date().getFullYear()

  const [{ data: leaveTypes }, { data: balances }, bankHolidays] = await Promise.all([
    supabase.from('leave_types').select('*').order('name'),
    supabase
      .from('leave_balances')
      .select('*, leave_types(*)')
      .eq('user_id', user.id)
      .eq('year', currentYear),
    getEnglandBankHolidays(),
  ])

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Leave Request</h1>
        <p className="text-gray-500 text-sm mt-1">Submit a request for time off</p>
      </div>
      <NewRequestForm
        leaveTypes={(leaveTypes ?? []) as LeaveType[]}
        balances={(balances ?? []) as LeaveBalance[]}
        bankHolidays={bankHolidays}
      />
    </div>
  )
}
