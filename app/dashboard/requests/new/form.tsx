'use client'

import { useState } from 'react'
import { submitLeaveRequest } from './actions'
import { Button } from '@/components/ui/button'
import { countWorkingDays } from '@/lib/utils'
import type { LeaveType, LeaveBalance } from '@/lib/types'

interface NewRequestFormProps {
  leaveTypes: LeaveType[]
  balances: LeaveBalance[]
}

export function NewRequestForm({ leaveTypes, balances }: NewRequestFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedTypeId, setSelectedTypeId] = useState('')

  const workingDays =
    startDate && endDate && new Date(endDate) >= new Date(startDate)
      ? countWorkingDays(startDate, endDate)
      : null

  const selectedBalance = balances.find((b) => b.leave_type_id === selectedTypeId)
  const remainingDays = selectedBalance
    ? selectedBalance.total_days - selectedBalance.used_days
    : null

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await submitLeaveRequest(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      {/* Leave type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Leave type <span className="text-red-500">*</span>
        </label>
        <select
          name="leave_type_id"
          required
          value={selectedTypeId}
          onChange={(e) => setSelectedTypeId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select leave type…</option>
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>
              {lt.name}
            </option>
          ))}
        </select>
        {selectedTypeId && remainingDays !== null && (
          <p className="mt-1 text-xs text-gray-500">
            Balance: <span className="font-medium text-gray-700">{remainingDays} day(s) remaining</span>
          </p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="start_date"
            required
            min={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="end_date"
            required
            min={startDate || today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {workingDays !== null && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-sm text-indigo-700">
          <span className="font-semibold">{workingDays}</span> working day{workingDays !== 1 ? 's' : ''}
        </div>
      )}

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
        <textarea
          name="reason"
          rows={3}
          placeholder="Any notes for your manager…"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Request'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
