'use server'

import { createClient } from '@/lib/supabase/server'
import { countWorkingDays } from '@/lib/utils'
import { getEnglandBankHolidays } from '@/lib/bank-holidays'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendNewRequestNotification } from '@/lib/email'

export async function submitLeaveRequest(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const leaveTypeId = formData.get('leave_type_id') as string
  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string
  const reason = formData.get('reason') as string

  if (!leaveTypeId || !startDate || !endDate) {
    return { error: 'Please fill in all required fields.' }
  }

  if (new Date(endDate) < new Date(startDate)) {
    return { error: 'End date cannot be before start date.' }
  }

  const bankHolidays = await getEnglandBankHolidays()
  const daysCount = countWorkingDays(startDate, endDate, bankHolidays)
  if (daysCount === 0) {
    return { error: 'Selected dates contain no working days.' }
  }

  const currentYear = new Date(startDate).getFullYear()

  // Check balance
  const { data: balance } = await supabase
    .from('leave_balances')
    .select('total_days, used_days')
    .eq('user_id', user.id)
    .eq('leave_type_id', leaveTypeId)
    .eq('year', currentYear)
    .single()

  // Skip balance check for leave types with no cap (total_days = 0, e.g. Unpaid Leave)
  if (balance && balance.total_days > 0) {
    const remaining = balance.total_days - balance.used_days
    if (daysCount > remaining) {
      return { error: `Insufficient balance. You have ${remaining} day(s) remaining.` }
    }
  }

  // Document was uploaded client-side; just receive the storage path
  const documentPath = (formData.get('document_path') as string | null) || null

  const { error } = await supabase.from('leave_requests').insert({
    user_id: user.id,
    leave_type_id: leaveTypeId,
    start_date: startDate,
    end_date: endDate,
    days_count: daysCount,
    reason: reason || null,
    document_path: documentPath,
    status: 'pending',
  })

  if (error) return { error: error.message }

  // Notify managers/hr_admin
  const [{ data: employeeProfile }, { data: leaveType }, { data: managers }] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
    supabase.from('leave_types').select('name').eq('id', leaveTypeId).single(),
    supabase.from('profiles').select('email').in('role', ['manager', 'hr_admin']),
  ])
  const managerEmails = (managers ?? []).map((m: { email: string }) => m.email).filter(Boolean)
  await sendNewRequestNotification({
    employeeName: employeeProfile?.full_name ?? 'Team member',
    leaveType: leaveType?.name ?? 'Leave',
    startDate,
    endDate,
    daysCount,
    reason: reason || null,
    managerEmails,
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/requests')
  revalidatePath('/dashboard/manager/requests')
  redirect('/dashboard/requests')
}
