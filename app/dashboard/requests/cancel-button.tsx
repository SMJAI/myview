'use client'

import { useState } from 'react'
import { cancelRequest } from './actions'

export function CancelRequestButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!confirm('Cancel this leave request?')) return
    setLoading(true)
    await cancelRequest(id)
    setLoading(false)
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      {loading ? 'Cancelling…' : 'Cancel'}
    </button>
  )
}
