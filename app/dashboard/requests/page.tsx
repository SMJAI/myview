import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/status-badge'
import { formatDate, formatDateShort } from '@/lib/utils'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import type { LeaveRequest } from '@/lib/types'
import { CancelRequestButton } from './cancel-button'

function Timeline({ request }: { request: LeaveRequest }) {
  const steps = [
    {
      label: 'Submitted',
      date: request.created_at,
      done: true,
      color: 'bg-brand-500',
    },
    {
      label: request.status === 'approved' ? 'Approved' : request.status === 'rejected' ? 'Rejected' : 'Awaiting review',
      date: request.reviewed_at ?? null,
      done: !!request.reviewed_at,
      color: request.status === 'approved' ? 'bg-green-500' : request.status === 'rejected' ? 'bg-red-500' : 'bg-gray-200',
    },
  ]

  return (
    <div className="flex items-center gap-1 mt-1.5">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && <div className="w-8 h-px bg-gray-200" />}
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${step.color}`} />
            <span className="text-[10px] text-gray-500 whitespace-nowrap">
              {step.label}
              {step.date && (
                <span className="text-gray-400 ml-0.5">
                  · {new Date(step.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function MyRequestsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*, leave_types(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-gray-500 text-sm mt-1">All your leave requests and their status</p>
        </div>
        <Link
          href="/dashboard/requests/new"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Request
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!requests || requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No leave requests yet.{' '}
            <Link href="/dashboard/requests/new" className="text-brand-600 hover:underline">Submit one now</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">From</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">To</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Days</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status &amp; Timeline</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Note</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(requests as LeaveRequest[]).map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.leave_types?.color ?? '#6B7280' }} />
                      <span className="font-medium text-gray-900">{r.leave_types?.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{formatDate(r.start_date)}</td>
                  <td className="px-5 py-3.5 text-gray-600">{formatDate(r.end_date)}</td>
                  <td className="px-5 py-3.5 text-gray-600">{r.days_count}d</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={r.status} />
                    <Timeline request={r} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-[180px] truncate text-xs italic">
                    {r.manager_note ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.status === 'pending' && <CancelRequestButton id={r.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
