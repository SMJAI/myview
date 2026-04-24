import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RequestsTable } from './requests-table'
import type { LeaveRequest } from '@/lib/types'

export default async function AllRequestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['manager', 'hr_admin'].includes(profile.role)) redirect('/dashboard')

  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*, profiles(*), leave_types(*)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Review and manage team leave requests</p>
      </div>
      <RequestsTable requests={(requests ?? []) as LeaveRequest[]} />
    </div>
  )
}
