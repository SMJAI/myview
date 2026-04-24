import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, ClipboardList, Clock } from 'lucide-react'
import type { Profile, LeaveRequest } from '@/lib/types'

export default async function ManagerPage() {
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

  if (profile?.role !== 'manager') redirect('/dashboard')

  const [{ data: employees }, { data: pendingRequests }, { data: allRequests }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'employee'),
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
      color: 'text-indigo-600 bg-indigo-50',
      href: '/dashboard/admin',
    },
    {
      label: 'Pending Requests',
      value: pendingRequests?.length ?? 0,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-50',
      href: '/dashboard/manager/requests',
    },
    {
      label: 'Upcoming Absences',
      value: allRequests?.filter((r: LeaveRequest) => r.status === 'approved').length ?? 0,
      icon: ClipboardList,
      color: 'text-green-600 bg-green-50',
      href: '/dashboard/calendar',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manager Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Team leave summary at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Team list */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Team</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {!employees || employees.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No employees yet.{' '}
              <Link href="/dashboard/admin" className="text-indigo-600 hover:underline">
                Add users
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(employees as Profile[]).map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                          {e.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{e.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{e.email}</td>
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
