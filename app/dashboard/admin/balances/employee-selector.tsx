'use client'

import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/avatar'
import type { Profile } from '@/lib/types'

interface EmployeeSelectorProps {
  employees: Profile[]
  selectedId: string
}

export function EmployeeSelector({ employees, selectedId }: EmployeeSelectorProps) {
  const router = useRouter()
  const selected = employees.find(e => e.id === selectedId)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2.5 block">
        Employee
      </label>
      <div className="relative">
        <select
          value={selectedId}
          onChange={e => router.push(`?user=${e.target.value}`)}
          className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent cursor-pointer"
        >
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.full_name}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
          ▾
        </div>
      </div>

      {selected && (
        <div className="mt-3 flex items-center gap-3">
          <Avatar avatarUrl={selected.avatar_url} name={selected.full_name} size={30} />
          <div className="text-xs text-gray-500 space-x-3">
            <span className="text-gray-700 font-medium">{selected.email}</span>
            {selected.start_date && (
              <span>
                Started{' '}
                {new Date(selected.start_date).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            )}
            {selected.weekly_hours && selected.weekly_hours !== 37.5 && (
              <span>{selected.weekly_hours}h/wk</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
