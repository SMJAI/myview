'use client'

import { useState } from 'react'
import { updateTotalDays, upsertBalance } from './actions'
import { prorateEntitlement, proratedBankHolidays } from '@/lib/proration'
import { Avatar } from '@/components/avatar'
import type { Profile, LeaveType, LeaveBalance } from '@/lib/types'

interface BalancesTableProps {
  employees: Profile[]
  leaveTypes: LeaveType[]
  balances: LeaveBalance[]
  year: number
  bankHolidays: string[]
}

export function BalancesTable({ employees, leaveTypes, balances, year, bankHolidays }: BalancesTableProps) {
  const [editing, setEditing] = useState<string | null>(null)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const defaultTypes = leaveTypes.filter(lt => lt.is_default)
  const extraTypes = leaveTypes.filter(lt => !lt.is_default)

  function getBalance(userId: string, leaveTypeId: string) {
    return balances.find(b => b.user_id === userId && b.leave_type_id === leaveTypeId)
  }

  function editKey(userId: string, leaveTypeId: string) {
    return `${userId}__${leaveTypeId}`
  }

  function getSuggested(emp: Profile, lt: LeaveType): number | null {
    if (!emp.start_date || lt.default_days === 0) return null
    if (lt.name === 'Bank Holiday') {
      return proratedBankHolidays(bankHolidays, emp.start_date, year)
    }
    return prorateEntitlement(lt.default_days, emp.start_date, year, emp.weekly_hours ?? 37.5)
  }

  async function handleSave(userId: string, leaveTypeId: string) {
    const days = parseFloat(value)
    if (isNaN(days) || days < 0) return
    setSaving(true)
    const existing = getBalance(userId, leaveTypeId)
    if (existing) {
      await updateTotalDays(existing.id, days)
    } else {
      await upsertBalance(userId, leaveTypeId, year, days)
    }
    setEditing(null)
    setSaving(false)
  }

  function startEdit(userId: string, leaveTypeId: string) {
    const existing = getBalance(userId, leaveTypeId)
    setValue(existing ? String(existing.total_days) : '0')
    setEditing(editKey(userId, leaveTypeId))
  }

  function applySuggested(suggested: number) {
    setValue(String(suggested))
  }

  return (
    <div className="space-y-10">
      {employees.map(emp => (
        <div key={emp.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Employee header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <Avatar avatarUrl={emp.avatar_url} name={emp.full_name} size={34} />
            <div>
              <p className="font-semibold text-gray-900">{emp.full_name}</p>
              <p className="text-xs text-gray-500">
                {emp.email}
                {emp.start_date && (
                  <span className="ml-2 text-gray-400">
                    · started {new Date(emp.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
                {emp.weekly_hours && emp.weekly_hours !== 37.5 && (
                  <span className="ml-2 text-gray-400">· {emp.weekly_hours}h/wk</span>
                )}
              </p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Leave Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entitlement (days)</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Used</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Remaining</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...defaultTypes, ...extraTypes].map(lt => {
                const bal = getBalance(emp.id, lt.id)
                const key = editKey(emp.id, lt.id)
                const isEditing = editing === key
                const remaining = bal ? bal.total_days - bal.used_days : null
                const suggested = getSuggested(emp, lt)

                return (
                  <tr key={lt.id} className={`hover:bg-gray-50 ${!bal && !lt.is_default ? 'opacity-40' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: lt.color }} />
                        <span className="text-gray-700">{lt.name}</span>
                        {!lt.is_default && !bal && (
                          <span className="text-xs text-gray-400 italic">not assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={value}
                            onChange={e => setValue(e.target.value)}
                            className="w-20 px-2 py-1 border border-brand-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            autoFocus
                          />
                          {suggested !== null && (
                            <button
                              type="button"
                              onClick={() => applySuggested(suggested)}
                              className="text-xs text-brand-600 hover:underline block"
                            >
                              Use prorated: {suggested}d
                            </button>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium text-gray-900">
                            {bal ? bal.total_days : '—'}
                          </span>
                          {!bal && suggested !== null && (
                            <span className="ml-2 text-xs text-gray-400">
                              (prorated: {suggested}d)
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{bal ? bal.used_days : '—'}</td>
                    <td className="px-5 py-3">
                      {remaining !== null && (
                        <span className={remaining <= 2 ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          {remaining}
                        </span>
                      )}
                      {remaining === null && '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleSave(emp.id, lt.id)}
                            disabled={saving}
                            className="text-xs bg-brand-600 text-white px-3 py-1 rounded-lg hover:bg-brand-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(emp.id, lt.id)}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          {bal ? 'Edit' : 'Assign'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
