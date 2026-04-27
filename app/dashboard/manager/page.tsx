import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, ClipboardList, Clock } from 'lucide-react'
import { AbsenceInsights } from '@/components/absence-insights'
import type { Profile, LeaveRequest } from '@/lib/types'
import { Avatar } from '@/components/avatar'

export default async function ManagerPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['manager', 'hr_admin'].includes(profile.role)) redirect('/dashboard')

  const isHrAdmin = profile.role === 'hr_admin'
  const pageTitle = isHrAdmin ? 'HR Overview' : 'Manager Overview'
  const pageSubtitle = isHrAdmin
    ? 'Team leave and workforce summary'
    : 'Team leave summary at a glance'

  const [{ data: employees }, { data: pendingRequests }, { data: allRequests }] =
    await Promise.all([
      supabase.from('profiles').select('*').neq('role', 'hr_admin').neq('id', user.id),
      supabase.from('leave_requests').select('*').eq('status', 'pending'),
      supabase
        .from('leave_requests')
        .select('*')
        .gte('start_date', new Date().toISOString().split('T')[0]),
    ])

  const stats = [
    {
      label: 'Team Members',
      value: employees?.length ?? 0,
      icon: Users,
      gradient: 'from-brand-50 to-brand-100',
      iconColor: 'text-brand-600',
      iconBg: 'bg-brand-100',
      href: '/dashboard/admin',
    },
    {
      label: 'Pending Requests',
      value: pendingRequests?.length ?? 0,
      icon: Clock,
      gradient: 'from-amber-50 to-amber-100',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      href: '/dashboard/manager/requests',
    },
    {
      label: 'Upcoming Absences',
      value: allRequests?.filter((r: LeaveRequest) => r.status === 'approved').length ?? 0,
      icon: ClipboardList,
      gradient: 'from-violet-50 to-violet-100',
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-100',
      href: '/dashboard/calendar',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        <p className="text-gray-500 text-sm mt-1">{pageSubtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, gradient, iconColor, iconBg, href }) => (
          <Link
            key={label}
            href={href}
            className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 hover:shadow-md transition-all group`}
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <p className="text-4xl font-bold text-gray-900 leading-none mb-1">{value}</p>
            <p className="text-sm text-gray-600 mt-1.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* AI Insights */}
      <AbsenceInsights />

      {/* Team list */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Team</h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {!employees || employees.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No team members yet.{' '}
              <Link href="/dashboard/admin" className="text-brand-600 hover:underline">
                Add users
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(employees as Profile[]).map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar avatarUrl={e.avatar_url} name={e.full_name} size={28} />
                        <span className="font-medium text-gray-900">{e.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{e.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        e.role === 'manager' ? 'bg-brand-50 text-brand-700'
                        : e.role === 'hr_admin' ? 'bg-violet-50 text-violet-700'
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                        {e.role === 'hr_admin' ? 'HR Admin' : e.role === 'manager' ? 'Manager' : 'Employee'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
