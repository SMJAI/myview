'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertBalance(
  userId: string,
  leaveTypeId: string,
  year: number,
  totalDays: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager') return { error: 'Not authorised' }

  const { error } = await supabase
    .from('leave_balances')
    .upsert({ user_id: userId, leave_type_id: leaveTypeId, year, total_days: totalDays, used_days: 0 },
      { onConflict: 'user_id,leave_type_id,year', ignoreDuplicates: false })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/balances')
}

export async function updateTotalDays(balanceId: string, totalDays: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager') return { error: 'Not authorised' }

  const { error } = await supabase
    .from('leave_balances')
    .update({ total_days: totalDays })
    .eq('id', balanceId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/balances')
}
