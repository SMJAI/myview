'use client'

import { useState } from 'react'
import { reviewRequest } from './actions'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { CheckCircle2, XCircle } from 'lucide-react'

interface ReviewModalProps {
  id: string
  employeeName: string
  onClose: () => void
}

export function ReviewModal({ id, employeeName, onClose }: ReviewModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState<'approved' | 'rejected' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {done ? (
          /* Success / rejection animation */
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
          /* Review form */
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Review Request</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Leave request from <span className="font-medium text-gray-700">{employeeName}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note to employee <span className="text-gray-400 font-normal">(optional)</span>
              </label>
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
