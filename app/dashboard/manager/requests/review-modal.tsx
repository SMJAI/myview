'use client'

import { useState } from 'react'
import { reviewRequest } from './actions'
import { Button } from '@/components/ui/button'

interface ReviewModalProps {
  id: string
  employeeName: string
  onClose: () => void
}

export function ReviewModal({ id, employeeName, onClose }: ReviewModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState<'approved' | 'rejected' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handle(status: 'approved' | 'rejected') {
    setError(null)
    setLoading(status)
    const result = await reviewRequest(id, status, note)
    if (result?.error) {
      setError(result.error)
      setLoading(null)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Review Request</h2>
        <p className="text-sm text-gray-500">
          Leave request from <span className="font-medium text-gray-700">{employeeName}</span>
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note to employee (optional)
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
          <Button
            variant="primary"
            onClick={() => handle('approved')}
            disabled={!!loading}
          >
            {loading === 'approved' ? 'Approving…' : 'Approve'}
          </Button>
          <Button
            variant="danger"
            onClick={() => handle('rejected')}
            disabled={!!loading}
          >
            {loading === 'rejected' ? 'Rejecting…' : 'Reject'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={!!loading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
