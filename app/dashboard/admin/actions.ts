'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function createUser(formData: FormData) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'manager') return { error: 'Not authorised' }

  const email = formData.get('email') as string
  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as string
  const password = formData.get('password') as string

  const admin = adminClient()

  const { data: newUser, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })

  if (error) return { error: error.message }
  if (!newUser.user) return { error: 'Failed to create user' }

  // Seed leave balances for default types only (annual, bank holiday, sick, compassionate)
  const { data: leaveTypes } = await supabase
    .from('leave_types')
    .select('id, default_days')
    .eq('is_default', true)
  if (leaveTypes && leaveTypes.length > 0) {
    const year = new Date().getFullYear()
    await supabase.from('leave_balances').insert(
      leaveTypes.map((lt) => ({
        user_id: newUser.user!.id,
        leave_type_id: lt.id,
        year,
        total_days: lt.default_days,
        used_days: 0,
      }))
    )
  }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/manager')
}

export async function updateUserRole(userId: string, role: 'employee' | 'manager') {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'manager') return { error: 'Not authorised' }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin')
}
