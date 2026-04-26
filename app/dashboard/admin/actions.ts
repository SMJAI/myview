'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getEnglandBankHolidays } from '@/lib/bank-holidays'
import { proratedBankHolidays } from '@/lib/proration'

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

  // When start_date is set, auto-recalculate bank holiday entitlement for the current year
  if (updates.start_date) {
    const currentYear = new Date().getFullYear()
    const [{ data: bhType }, bankHolidays] = await Promise.all([
      adminClient.from('leave_types').select('id').eq('name', 'Bank Holiday').single(),
      getEnglandBankHolidays(),
    ])
    if (bhType) {
      const bhDays = proratedBankHolidays(bankHolidays, updates.start_date, currentYear)
      const { data: existing } = await adminClient
        .from('leave_balances').select('id')
        .eq('user_id', userId).eq('leave_type_id', bhType.id).eq('year', currentYear)
        .maybeSingle()
      if (existing) {
        await adminClient.from('leave_balances').update({ total_days: bhDays }).eq('id', existing.id)
      } else {
        await adminClient.from('leave_balances')
          .insert({ user_id: userId, leave_type_id: bhType.id, year: currentYear, total_days: bhDays, used_days: 0 })
      }
    }
  }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/balances')
  revalidatePath('/dashboard/manager')
}

export async function seedLeaveBalances(userId: string, year: number) {
  const { error } = await authorise()
  if (error) return { error }

  const adminClient = createAdminClient()

  const [{ data: leaveTypes }, { data: profile }, bankHolidays] = await Promise.all([
    adminClient.from('leave_types').select('id, name, default_days').eq('is_default', true),
    adminClient.from('profiles').select('start_date, weekly_hours').eq('id', userId).single(),
    getEnglandBankHolidays(),
  ])

  if (!leaveTypes || leaveTypes.length === 0) return

  const { data: existing } = await adminClient
    .from('leave_balances').select('leave_type_id').eq('user_id', userId).eq('year', year)

  const existingIds = new Set((existing ?? []).map((b: { leave_type_id: string }) => b.leave_type_id))

  const toInsert = leaveTypes
    .filter((lt) => !existingIds.has(lt.id))
    .map((lt) => {
      let totalDays = lt.default_days
      // Auto-calculate bank holidays from employee start date
      if (lt.name === 'Bank Holiday' && profile?.start_date) {
        totalDays = proratedBankHolidays(bankHolidays, profile.start_date, year)
      }
      return { user_id: userId, leave_type_id: lt.id, year, total_days: totalDays, used_days: 0 }
    })

  if (toInsert.length > 0) {
    await adminClient.from('leave_balances').insert(toInsert)
  }

  revalidatePath('/dashboard/admin/balances')
}

export async function deleteUser(userId: string) {
  const { user, error } = await authorise()
  if (error || !user) return { error }

  if (user.id === userId) return { error: 'You cannot remove your own account.' }

  const adminClient = createAdminClient()

  // Delete auth user — profiles row cascades via FK
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
  if (authError) return { error: authError.message }

  revalidatePath('/dashboard/admin')
}
