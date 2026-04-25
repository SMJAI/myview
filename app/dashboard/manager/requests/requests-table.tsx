'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/status-badge'
import { formatDate } from '@/lib/utils'
import { ReviewModal } from './review-modal'
import { getDocumentSignedUrl } from './actions'
import type { LeaveRequest } from '@/lib/types'
import { Paperclip } from 'lucide-react'

interface RequestsTableProps {
  requests: LeaveRequest[]
}

export function RequestsTable({ requests }: RequestsTableProps) {
  const [reviewing, setReviewing] = useState<LeaveRequest | null>(null)
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null)

  async function openDocument(requestId: string, path: string) {
    setLoadingDoc(requestId)
    const url = await getDocumentSignedUrl(path)
    setLoadingDoc(null)
    if (url) window.open(url, '_blank')
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
        No requests found.
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">From</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">To</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Days</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold shrink-0">
                      {r.profiles?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{r.profiles?.full_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{r.leave_types?.name}</td>
                <td className="px-5 py-3.5 text-gray-600">{formatDate(r.start_date)}</td>
                <td className="px-5 py-3.5 text-gray-600">{formatDate(r.end_date)}</td>
                <td className="px-5 py-3.5 text-gray-600">{r.days_count}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3 justify-end">
                    {r.document_path && (
                      <button
                        onClick={() => openDocument(r.id, r.document_path!)}
                        disabled={loadingDoc === r.id}
                        title="View supporting document"
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600 transition-colors disabled:opacity-50"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        {loadingDoc === r.id ? 'Opening…' : 'Doc'}
                      </button>
                    )}
                    {r.status === 'pending' && (
                      <button
                        onClick={() => setReviewing(r)}
                        className="text-xs text-brand-600 font-medium hover:underline"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reviewing && (
        <ReviewModal
          id={reviewing.id}
          employeeName={reviewing.profiles?.full_name ?? 'Employee'}
          onClose={() => setReviewing(null)}
        />
      )}
    </>
  )
}
