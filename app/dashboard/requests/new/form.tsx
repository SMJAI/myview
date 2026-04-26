'use client'

import { useState, useRef } from 'react'
import { submitLeaveRequest } from './actions'
import { suggestLeaveType, autocompleteReason } from '@/app/dashboard/ai-actions'
import { Button } from '@/components/ui/button'
import { countWorkingDays } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Paperclip, X } from 'lucide-react'
import type { LeaveType, LeaveBalance } from '@/lib/types'

interface NewRequestFormProps {
  leaveTypes: LeaveType[]
  balances: LeaveBalance[]
  bankHolidays: string[]
}

export function NewRequestForm({ leaveTypes, balances, bankHolidays }: NewRequestFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [autocomplete, setAutocomplete] = useState('')
  const [aiJustSelected, setAiJustSelected] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function runAiSuggestions(text: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setAutocomplete('')
    if (text.length >= 5) {
      debounceRef.current = setTimeout(async () => {
        const [id, completion] = await Promise.all([
          text.length >= 8 ? suggestLeaveType(text, leaveTypes.map(lt => ({ id: lt.id, name: lt.name }))) : null,
          autocompleteReason(text),
        ])
        if (id) {
          setSelectedTypeId(id)
          setAiJustSelected(true)
          setTimeout(() => setAiJustSelected(false), 1500)
        }
        if (completion) setAutocomplete(completion)
      }, 600)
    }
  }

  function handleReasonChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value
    setReasonText(text)
    runAiSuggestions(text)
  }

  function handleReasonKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab' && autocomplete) {
      e.preventDefault()
      const newText = reasonText + autocomplete
      setReasonText(newText)
      runAiSuggestions(newText)
    }
  }

  const workingDays =
    startDate && endDate && new Date(endDate) >= new Date(startDate)
      ? countWorkingDays(startDate, endDate, bankHolidays)
      : null

  const selectedBalance = balances.find((b) => b.leave_type_id === selectedTypeId)
  const remainingDays = selectedBalance
    ? selectedBalance.total_days - selectedBalance.used_days
    : null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    // Upload file directly from browser to Supabase Storage (no server size limit)
    if (file) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${user.id}/${Date.now()}_${safeName}`
        const { data: uploaded } = await supabase.storage
          .from('leave-documents')
          .upload(path, file, { contentType: file.type })
        if (uploaded) formData.set('document_path', uploaded.path)
      }
    }

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
          onChange={(e) => { setSelectedTypeId(e.target.value); setAiJustSelected(false) }}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all duration-300 ${
            aiJustSelected ? 'border-brand-400 ring-2 ring-brand-100' : 'border-gray-300'
          }`}
        >
          <option value="">Select leave type…</option>
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>{lt.name}</option>
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
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate(e.target.value) }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
            min={startDate || undefined}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {workingDays !== null && (
        <div className="bg-brand-50 border border-brand-100 rounded-lg px-4 py-3 text-sm text-brand-700">
          <span className="font-semibold">{workingDays}</span> working day{workingDays !== 1 ? 's' : ''}
          <span className="text-brand-500 font-normal"> (weekends &amp; bank holidays excluded)</span>
        </div>
      )}

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
        <div className="relative">
          {/* Ghost text layer — sits behind the transparent textarea */}
          <div
            aria-hidden
            className="absolute inset-0 px-3 py-2 text-sm pointer-events-none overflow-hidden rounded-lg"
            style={{ lineHeight: '1.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}
          >
            <span style={{ visibility: 'hidden' }}>{reasonText}</span>
            <span className="text-gray-400">{autocomplete}</span>
          </div>
          <textarea
            name="reason"
            rows={3}
            value={reasonText}
            placeholder="Any notes for your manager…"
            onChange={handleReasonChange}
            onKeyDown={handleReasonKeyDown}
            className="relative w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none bg-transparent"
            style={{ lineHeight: '1.5rem' }}
          />
        </div>
      </div>

      {/* Supporting document */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Supporting document <span className="text-gray-400 font-normal">(optional — e.g. sick certificate)</span>
        </label>
        {file ? (
          <div className="flex items-center gap-2 px-3 py-2 border border-brand-200 bg-brand-50 rounded-lg text-sm">
            <Paperclip className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="flex-1 text-brand-700 truncate">{file.name}</span>
            <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 cursor-pointer transition-colors">
            <Paperclip className="w-4 h-4 shrink-0" />
            <span>Click to attach PDF, JPG or PNG (max 10MB)</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
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
