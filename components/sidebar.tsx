'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  ClipboardList,
  Users,
  LogOut,
  Sliders,
  BarChart3,
  FileBarChart2,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

interface SidebarProps {
  profile: Profile
  pendingCount?: number
}

const employeeNav = [
  { href: '/dashboard',              label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/requests/new', label: 'New Request',   icon: PlusCircle },
  { href: '/dashboard/requests',     label: 'My Requests',   icon: ClipboardList },
  { href: '/dashboard/balances',     label: 'My Balances',   icon: BarChart3 },
  { href: '/dashboard/calendar',     label: 'Team Calendar', icon: CalendarDays },
]

const managerNav = [
  { href: '/dashboard/manager',          label: 'Overview',      icon: ShieldCheck },
  { href: '/dashboard/manager/requests', label: 'All Requests',  icon: ClipboardList, showBadge: true },
  { href: '/dashboard/manager/balances', label: 'Team Balances', icon: BarChart3 },
]

const hrAdminNav = [
  { href: '/dashboard/manager/requests', label: 'All Requests',   icon: ClipboardList, showBadge: true },
  { href: '/dashboard/admin/balances',   label: 'Leave Balances', icon: Sliders },
  { href: '/dashboard/admin/reports',    label: 'Reports',        icon: FileBarChart2 },
  { href: '/dashboard/admin',            label: 'Users',          icon: Users },
]

type ViewKey = 'employee' | 'admin'

const ROLE_CONFIG: Record<string, { label: string; nav: { href: string; label: string; icon: React.FC<{ className?: string }>; showBadge?: boolean }[] }> = {
  manager:  { label: 'Manager',  nav: managerNav },
  hr_admin: { label: 'HR Admin', nav: hrAdminNav },
}

export function Sidebar({ profile, pendingCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const hasAdminRole = profile.role in ROLE_CONFIG
  const adminConfig  = ROLE_CONFIG[profile.role]
  const storageKey   = `myview_view_${profile.id}`

  const onAdminRoute = pathname.startsWith('/dashboard/manager') || pathname.startsWith('/dashboard/admin')
  const [view, setView] = useState<ViewKey>('employee')

  useEffect(() => {
    if (onAdminRoute) {
      setView('admin')
      localStorage.setItem(storageKey, 'admin')
    } else {
      const stored = localStorage.getItem(storageKey) as ViewKey | null
      setView(stored === 'admin' ? 'admin' : 'employee')
    }
  }, [storageKey, onAdminRoute])

  function switchView(next: ViewKey) {
    setView(next)
    localStorage.setItem(storageKey, next)
    if (next === 'employee' && onAdminRoute) router.push('/dashboard')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const activeNav = hasAdminRole && view === 'admin' ? adminConfig.nav : employeeNav

  const roleLabel =
    profile.role === 'hr_admin' ? 'HR Admin'
    : profile.role === 'manager' ? 'Manager'
    : 'Employee'

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Physio Healing Hands" width={38} height={38} className="shrink-0" />
          <div>
            <p className="text-[15px] font-bold text-brand-600 leading-tight">MyView</p>
            <p className="text-[11px] text-gray-400 leading-tight">Physio Healing Hands</p>
          </div>
        </div>
      </div>

      {/* View switcher — only shown for manager / hr_admin */}
      {hasAdminRole && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex rounded-lg bg-gray-100 p-0.5 gap-0.5">
            <button
              onClick={() => switchView('employee')}
              className={cn(
                'flex-1 text-xs font-medium py-1.5 rounded-md transition-all',
                view === 'employee'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              My Space
            </button>
            <button
              onClick={() => switchView('admin')}
              className={cn(
                'flex-1 text-xs font-medium py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5',
                view === 'admin'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {adminConfig.label}
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-1 leading-none">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {activeNav.map(({ href, label, icon: Icon, showBadge }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-brand-600' : 'text-gray-400')} />
              <span className="flex-1">{label}</span>
              {showBadge && pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm shrink-0">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
            <p className="text-xs text-gray-400">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
