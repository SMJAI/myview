'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function reviewRequest(
  id: string,
  status: 'approved' | 'rejected',
  managerNote: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['manager', 'hr_admin'].includes(profile.role)) return { error: 'Not authorised' }

  // Get the request to update balance if approved
  const { data: request } = await supabase
    .from('leave_requests')
    .select('user_id, leave_type_id, days_count, start_date')
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

  // Deduct from balance when approved
  if (status === 'approved') {
    const year = new Date(request.start_date).getFullYear()
    await supabase.rpc('increment_used_days', {
      p_user_id: request.user_id,
      p_leave_type_id: request.leave_type_id,
      p_year: year,
      p_days: request.days_count,
    })
  }

  revalidatePath('/dashboard/manager/requests')
  revalidatePath('/dashboard/manager')
  revalidatePath('/dashboard')
}
