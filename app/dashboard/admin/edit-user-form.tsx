'use client'

import { useState } from 'react'
import { updateUserProfile, deleteUser } from './actions'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/lib/types'

interface EditUserFormProps {
  user: Profile
}

const ROLE_LABELS: Record<string, string> = {
  employee: 'Employee',
  manager: 'Manager',
  hr_admin: 'HR Admin',
}

export function EditUserForm({ user }: EditUserFormProps) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState(user.role)
  const [startDate, setStartDate] = useState(user.start_date ?? '')
  const [weeklyHours, setWeeklyHours] = useState(
    user.weekly_hours != null ? String(user.weekly_hours) : '37.5'
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await updateUserProfile(user.id, {
      role: role as 'employee' | 'manager' | 'hr_admin',
      start_date: startDate || null,
      weekly_hours: weeklyHours ? parseFloat(weeklyHours) : null,
    })
    if (result?.error) {
      setError(String(result.error))
      setSaving(false)
    } else {
      setOpen(false)
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    const result = await deleteUser(user.id)
    if (result?.error) {
      setError(String(result.error))
      setDeleting(false)
      setConfirmDelete(false)
    }
    // Page revalidates automatically — modal closes as user row disappears
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-brand-600 hover:underline"
      >
        Edit
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{user.full_name}</h2>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'employee' | 'manager' | 'hr_admin')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {Object.entries(ROLE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            {role === 'manager' && 'Can submit leave + approve/reject team requests'}
            {role === 'hr_admin' && 'Can submit leave + manage users and balances'}
            {role === 'employee' && 'Can submit and view their own leave requests'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employment start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-gray-400">Used to prorate leave entitlements</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contracted hours / week</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={37.5}
              step={0.5}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-500">hrs (full time = 37.5)</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Part-time hours are used to scale leave entitlements</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {confirmDelete ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm text-red-700 font-medium">
              Remove <strong>{user.full_name}</strong> ({user.email})?
            </p>
            <p className="text-xs text-red-500">
              This permanently deletes their account and all associated data. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Removing…' : 'Yes, remove'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="px-3 py-1.5 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Remove user
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
