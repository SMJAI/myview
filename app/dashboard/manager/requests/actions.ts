'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendRequestReviewedNotification } from '@/lib/email'

export async function reviewRequest(
  id: string,
  status: 'approved' | 'rejected',
  managerNote: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['manager', 'hr_admin'].includes(profile.role)) return { error: 'Not authorised' }

  const { data: request } = await supabase
    .from('leave_requests')
    .select('user_id, leave_type_id, days_count, start_date, end_date, profiles!user_id(*), leave_types(*)')
    .eq('id', id)
    .single()

  if (!request) return { error: 'Request not found' }

  const { error } = await supabase
    .from('leave_requests')
    .update({
      status,
      manager_note: managerNote || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  if (status === 'approved') {
    const year = new Date(request.start_date).getFullYear()
    await supabase.rpc('increment_used_days', {
      p_user_id: request.user_id,
      p_leave_type_id: request.leave_type_id,
      p_year: year,
      p_days: request.days_count,
    })
  }

  // Notify employee by email
  const emp = request.profiles as { email?: string; full_name?: string } | null
  if (emp?.email) {
    await sendRequestReviewedNotification({
      employeeEmail: emp.email,
      employeeName: emp.full_name ?? 'Team member',
      leaveType: (request.leave_types as { name?: string } | null)?.name ?? 'Leave',
      startDate: request.start_date,
      endDate: request.end_date,
      daysCount: request.days_count,
      status,
      managerNote: managerNote || null,
    })
  }

  revalidatePath('/dashboard/manager/requests')
  revalidatePath('/dashboard/manager')
  revalidatePath('/dashboard')
}

export async function getDocumentSignedUrl(path: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['manager', 'hr_admin'].includes(profile.role)) return null

  const adminClient = createAdminClient()
  const { data } = await adminClient.storage.from('leave-documents').createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}
