'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { LeaveType, Profile, LeaveRequest, LeaveBalance } from '@/lib/types'

interface Filters {
  report: string
  type: string
  from: string
  to: string
  employee: string
}

interface ReportFiltersProps {
  leaveTypes: LeaveType[]
  employees: Profile[]
  filters: Filters
  requestRows: LeaveRequest[]
  balanceRows: (LeaveBalance & { profiles?: Profile })[]
}

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportFilters({
  leaveTypes, employees, filters, requestRows, balanceRows,
}: ReportFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [local, setLocal] = useState(filters)

  function apply(patch: Partial<Filters>) {
    const next = { ...local, ...patch }
    setLocal(next)
    const params = new URLSearchParams()
    Object.entries(next).forEach(([k, v]) => { if (v) params.set(k, v) })
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  function handleExport() {
    if (local.report === 'requests') {
      const headers = ['Employee', 'Email', 'Leave Type', 'From', 'To', 'Days', 'Status', 'Reason', 'Submitted']
      const rows = requestRows.map(r => [
        r.profiles?.full_name ?? '',
        r.profiles?.email ?? '',
        r.leave_types?.name ?? '',
        r.start_date,
        r.end_date,
        String(r.days_count),
        r.status,
        r.reason ?? '',
        r.created_at.slice(0, 10),
      ])
      downloadCSV(`leave-requests-${local.from}-to-${local.to}.csv`, rows, headers)
    } else {
      const headers = ['Employee', 'Email', 'Leave Type', 'Entitlement (days)', 'Used (days)', 'Remaining (days)']
      const rows = balanceRows.map(b => [
        b.profiles?.full_name ?? '',
        b.profiles?.email ?? '',
        b.leave_types?.name ?? '',
        String(b.total_days),
        String(b.used_days),
        String(b.total_days - b.used_days),
      ])
      downloadCSV(`leave-balances-${new Date().getFullYear()}.csv`, rows, headers)
    }
  }

  const inputCls = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white'

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Report type</label>
          <select
            value={local.report}
            onChange={e => apply({ report: e.target.value })}
            className={inputCls}
          >
            <option value="requests">Leave Requests</option>
            <option value="balances">Balances Snapshot</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Leave type</label>
          <select
            value={local.type}
            onChange={e => apply({ type: e.target.value })}
            className={inputCls}
          >
            <option value="all">All types</option>
            {leaveTypes.map(lt => (
              <option key={lt.id} value={lt.id}>{lt.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Employee</label>
          <select
            value={local.employee}
            onChange={e => apply({ employee: e.target.value })}
            className={inputCls}
          >
            <option value="all">All employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.full_name}</option>
            ))}
          </select>
        </div>

        {local.report === 'requests' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={local.from}
                onChange={e => apply({ from: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={local.to}
                onChange={e => apply({ to: e.target.value })}
                className={inputCls}
              />
            </div>
          </>
        )}

        <button
          onClick={handleExport}
          className="ml-auto px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          Export CSV
        </button>
      </div>
    </div>
  )
}
