'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function cancelRequest(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('leave_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidatePath('/dashboard/requests')
  revalidatePath('/dashboard')
}
