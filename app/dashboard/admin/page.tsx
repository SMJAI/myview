import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditUserForm } from './edit-user-form'
import type { Profile } from '@/lib/types'
import { canManageUsers } from '@/lib/types'
import { Avatar } from '@/components/avatar'

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  manager:  { label: 'Manager',  className: 'bg-brand-100 text-brand-700' },
  hr_admin: { label: 'HR Admin', className: 'bg-purple-100 text-purple-700' },
  employee: { label: 'Employee', className: 'bg-gray-100 text-gray-600' },
}

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !canManageUsers(profile.role)) redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">Manage team members for Physio Healing Hands</p>
        </div>
      </div>

      {/* Onboarding hint */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl px-5 py-4 text-sm text-brand-700">
        <p className="font-medium mb-0.5">Adding a new team member?</p>
        <p className="text-brand-600">
          Ask them to sign in at this app with their{' '}
          <span className="font-medium">@physiohealinghands.com</span> Google account.
          They&apos;ll appear here automatically as an Employee — you can then edit their role and start date below.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!users || users.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No users yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hrs/wk</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(users as Profile[]).map((u) => {
                const badge = ROLE_LABELS[u.role] ?? ROLE_LABELS.employee
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar avatarUrl={u.avatar_url} name={u.full_name} size={32} />
                        <span className="font-medium text-gray-900">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {u.start_date
                        ? new Date(u.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {u.weekly_hours != null ? `${u.weekly_hours}h` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <EditUserForm user={u} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
