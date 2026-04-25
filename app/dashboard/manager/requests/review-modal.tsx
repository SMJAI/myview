'use client'

import { useState, useEffect } from 'react'
import { reviewRequest } from './actions'
import { checkCoverageRisk, draftManagerNote } from '@/app/dashboard/ai-actions'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { CheckCircle2, XCircle, Sparkles, AlertTriangle, Info } from 'lucide-react'
import type { LeaveRequest } from '@/lib/types'

interface ReviewModalProps {
  id: string
  employeeName: string
  request?: LeaveRequest
  onClose: () => void
}

export function ReviewModal({ id, employeeName, request, onClose }: ReviewModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState<'approved' | 'rejected' | null>(null)
  const [draftingNote, setDraftingNote] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)
  const [coverage, setCoverage] = useState<{ risk: boolean; message: string | null } | null>(null)

  // Check coverage risk when modal opens
  useEffect(() => {
    if (request?.start_date && request?.end_date) {
      checkCoverageRisk(request.start_date, request.end_date, id).then(setCoverage)
    }
  }, [id, request])

  async function handle(status: 'approved' | 'rejected') {
    setError(null)
    setLoading(status)
    const result = await reviewRequest(id, status, note)
    if (result?.error) {
      setError(result.error)
      setLoading(null)
    } else {
      setDone(status)
      toast(
        status === 'approved'
          ? `✅ Request from ${employeeName} approved`
          : `Request from ${employeeName} rejected`,
        status === 'approved' ? 'success' : 'info'
      )
      setTimeout(() => onClose(), 1400)
    }
  }

  async function handleDraftNote(status: 'approved' | 'rejected') {
    if (!request) return
    setDraftingNote(true)
    const drafted = await draftManagerNote(
      employeeName,
      request.leave_types?.name ?? 'Leave',
      request.start_date,
      request.end_date,
      request.days_count,
      status
    )
    if (drafted) setNote(drafted)
    setDraftingNote(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {done ? (
          <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
            {done === 'approved' ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-9 h-9 text-green-500" />
                </div>
                <p className="text-lg font-semibold text-gray-900">Request approved!</p>
                <p className="text-sm text-gray-500 mt-1">{employeeName} will be notified.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="w-9 h-9 text-red-500" />
                </div>
                <p className="text-lg font-semibold text-gray-900">Request rejected</p>
                <p className="text-sm text-gray-500 mt-1">{employeeName} will be notified.</p>
              </>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Review Request</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Leave request from <span className="font-medium text-gray-700">{employeeName}</span>
                {request && (
                  <span className="text-gray-400">
                    {' '}· {request.leave_types?.name} · {request.days_count}d
                  </span>
                )}
              </p>
            </div>

            {/* Coverage risk alert */}
            {coverage?.message && (
              <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm ${
                coverage.risk
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-blue-50 border border-blue-100 text-blue-700'
              }`}>
                {coverage.risk
                  ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  : <Info className="w-4 h-4 shrink-0 mt-0.5" />
                }
                <span>{coverage.message}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Note to employee <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                {request && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={draftingNote}
                      onClick={() => handleDraftNote('approved')}
                      className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 disabled:opacity-40"
                    >
                      <Sparkles className="w-3 h-3" />
                      {draftingNote ? 'Drafting…' : 'Draft approve note'}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      disabled={draftingNote}
                      onClick={() => handleDraftNote('rejected')}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
                    >
                      <Sparkles className="w-3 h-3" />
                      {draftingNote ? '' : 'Draft reject note'}
                    </button>
                  </div>
                )}
              </div>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any comments for the employee…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="primary" onClick={() => handle('approved')} disabled={!!loading}>
                {loading === 'approved' ? 'Approving…' : 'Approve'}
              </Button>
              <Button variant="danger" onClick={() => handle('rejected')} disabled={!!loading}>
                {loading === 'rejected' ? 'Rejecting…' : 'Reject'}
              </Button>
              <Button variant="secondary" onClick={onClose} disabled={!!loading}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
