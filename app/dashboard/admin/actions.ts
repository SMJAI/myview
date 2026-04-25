'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function authorise() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized' as const }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['manager', 'hr_admin'].includes(profile.role)) {
    return { user: null, error: 'Not authorised' as const }
  }
  return { user, error: null }
}

export async function updateUserProfile(
  userId: string,
  updates: {
    role: 'employee' | 'manager' | 'hr_admin'
    start_date: string | null
    weekly_hours: number | null
  }
) {
  const { error } = await authorise()
  if (error) return { error }

  // Use service role client to bypass RLS when updating another user's profile
  const adminClient = createAdminClient()
  const { error: dbError } = await adminClient
    .from('profiles')
    .update({
      role: updates.role,
      start_date: updates.start_date || null,
      weekly_hours: updates.weekly_hours || null,
    })
    .eq('id', userId)

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/manager')
}

export async function seedLeaveBalances(userId: string, year: number) {
  const { error } = await authorise()
  if (error) return { error }

  const adminClient = createAdminClient()
  const { data: leaveTypes } = await adminClient
    .from('leave_types')
    .select('id, default_days')
    .eq('is_default', true)

  if (!leaveTypes || leaveTypes.length === 0) return

  // Only insert balances that don't already exist
  const { data: existing } = await adminClient
    .from('leave_balances')
    .select('leave_type_id')
    .eq('user_id', userId)
    .eq('year', year)

  const existingIds = new Set((existing ?? []).map((b: { leave_type_id: string }) => b.leave_type_id))
  const toInsert = leaveTypes
    .filter((lt) => !existingIds.has(lt.id))
    .map((lt) => ({
      user_id: userId,
      leave_type_id: lt.id,
      year,
      total_days: lt.default_days,
      used_days: 0,
    }))

  if (toInsert.length > 0) {
    await adminClient.from('leave_balances').insert(toInsert)
  }

  revalidatePath('/dashboard/admin/balances')
}
