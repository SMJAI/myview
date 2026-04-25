'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  ClipboardList,
  Users,
  ShieldCheck,
  LogOut,
  Sliders,
  UserRound,
  ChevronDown,
  BarChart3,
  FileBarChart2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface SidebarProps {
  profile: Profile
  pendingCount?: number
}

const employeeNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/requests/new', label: 'New Request', icon: PlusCircle },
  { href: '/dashboard/requests', label: 'My Requests', icon: ClipboardList },
  { href: '/dashboard/balances', label: 'My Balances', icon: BarChart3 },
  { href: '/dashboard/calendar', label: 'Team Calendar', icon: CalendarDays },
]

const managerNav = [
  { href: '/dashboard/manager', label: 'Manager Overview', icon: ShieldCheck },
  { href: '/dashboard/manager/requests', label: 'All Requests', icon: ClipboardList, showBadge: true },
  { href: '/dashboard/manager/balances', label: 'Team Balances', icon: BarChart3 },
]

const hrAdminNav = [
  { href: '/dashboard/manager/requests', label: 'All Requests', icon: ClipboardList, showBadge: true },
  { href: '/dashboard/admin/balances', label: 'Leave Balances', icon: Sliders },
  { href: '/dashboard/admin/reports', label: 'Reports', icon: FileBarChart2 },
  { href: '/dashboard/admin', label: 'Users', icon: Users },
]

const ROLE_SECTION: Record<string, { label: string; nav: { href: string; label: string; icon: React.FC<{ className?: string }>; showBadge?: boolean }[] }> = {
  manager:  { label: 'Manager',  nav: managerNav },
  hr_admin: { label: 'HR Admin', nav: hrAdminNav },
}

export function Sidebar({ profile, pendingCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const storageKey = `myview_employee_mode_${profile.id}`

  const hasAdminSection = profile.role in ROLE_SECTION

  const [employeeMode, setEmployeeMode] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored === 'true') setEmployeeMode(true)
  }, [storageKey])

  function toggleMode() {
    const next = !employeeMode
    setEmployeeMode(next)
    localStorage.setItem(storageKey, String(next))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const section = ROLE_SECTION[profile.role]

  const roleLabel =
    profile.role === 'hr_admin' ? 'HR Admin'
    : profile.role === 'manager' ? 'Manager'
    : 'Employee'

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Physio Healing Hands" width={40} height={40} className="shrink-0" />
          <div>
            <p className="text-base font-bold text-brand-600 leading-tight">MyView</p>
            <p className="text-xs text-gray-400 leading-tight">Physio Healing Hands</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {employeeNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-brand-50 text-brand-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        {hasAdminSection && !employeeMode && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.label}
              </p>
            </div>
            {section.nav.map(({ href, label, icon: Icon, showBadge }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {showBadge && pendingCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                    {pendingCount}
                  </span>
                )}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Mode toggle */}
      {hasAdminSection && (
        <div className="px-4 pb-2">
          <button
            onClick={toggleMode}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {employeeMode ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                Show {section.label} menu
              </>
            ) : (
              <>
                <UserRound className="w-3.5 h-3.5 shrink-0" />
                Employee view only
              </>
            )}
          </button>
        </div>
      )}

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm shrink-0">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
            <p className="text-xs text-gray-500">
              {employeeMode && hasAdminSection ? 'Employee view' : roleLabel}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
