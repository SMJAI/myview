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
import { Avatar } from './avatar'

interface SidebarProps {
  profile: Profile
  pendingCount?: number
  notificationCount?: number
}

interface NavItem {
  href: string
  label: string
  icon: React.FC<{ className?: string }>
  showBadge?: boolean
}

const employeeNav: NavItem[] = [
  { href: '/dashboard',              label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/requests/new', label: 'New Request',   icon: PlusCircle },
  { href: '/dashboard/requests',     label: 'My Requests',   icon: ClipboardList },
  { href: '/dashboard/balances',     label: 'My Balances',   icon: BarChart3 },
  { href: '/dashboard/calendar',     label: 'Team Calendar', icon: CalendarDays },
]

const managerNav: NavItem[] = [
  { href: '/dashboard/manager',          label: 'Overview',      icon: ShieldCheck },
  { href: '/dashboard/manager/requests', label: 'All Requests',  icon: ClipboardList, showBadge: true },
  { href: '/dashboard/manager/balances', label: 'Team Balances', icon: BarChart3 },
]

const hrAdminNav: NavItem[] = [
  { href: '/dashboard/manager',          label: 'Overview',       icon: ShieldCheck },
  { href: '/dashboard/manager/requests', label: 'All Requests',   icon: ClipboardList, showBadge: true },
  { href: '/dashboard/admin/balances',   label: 'Leave Balances', icon: Sliders },
  { href: '/dashboard/admin/reports',    label: 'Reports',        icon: FileBarChart2 },
  { href: '/dashboard/admin',            label: 'Users',          icon: Users },
]

type ViewKey = 'employee' | 'admin'

const ROLE_CONFIG: Record<string, { label: string; nav: NavItem[] }> = {
  manager:  { label: 'Manager',  nav: managerNav },
  hr_admin: { label: 'HR Admin', nav: hrAdminNav },
}

function PlantDecoration() {
  return (
    <div className="flex justify-center items-end px-4 py-2 opacity-50 pointer-events-none select-none">
      <svg width="100" height="72" viewBox="0 0 100 72" fill="none" aria-hidden="true">
        {/* Leaves */}
        <ellipse cx="30" cy="38" rx="24" ry="13" fill="#16a34a" transform="rotate(-30 30 38)" opacity="0.85"/>
        <ellipse cx="68" cy="40" rx="22" ry="12" fill="#22c55e" transform="rotate(25 68 40)" opacity="0.85"/>
        <ellipse cx="48" cy="26" rx="18" ry="10" fill="#15803d" transform="rotate(-10 48 26)" opacity="0.9"/>
        <ellipse cx="55" cy="36" rx="14" ry="8" fill="#4ade80" transform="rotate(15 55 36)" opacity="0.7"/>
        {/* Stem */}
        <path d="M50 62 Q50 48 50 32" stroke="#166534" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Pot rim */}
        <rect x="33" y="60" width="34" height="5" rx="2.5" fill="#9ca3af"/>
        {/* Pot body */}
        <path d="M36 65 L64 65 L61 72 L39 72 Z" fill="#d1d5db"/>
      </svg>
    </div>
  )
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
    <aside className="w-64 h-screen sticky top-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">

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

      {/* View switcher — only for manager / hr_admin */}
      {hasAdminRole ? (
        <div className="px-4 pt-4 pb-1">
          <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
            <button
              onClick={() => switchView('employee')}
              className={cn(
                'flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all',
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
                'flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5',
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
      ) : (
        <div className="px-5 pt-4 pb-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">My Space</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
        {activeNav.map(({ href, label, icon: Icon, showBadge }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              )}
            >
              {/* Active left border */}
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-brand-600 rounded-r-full" />
              )}
              <Icon className={cn('w-[18px] h-[18px] shrink-0', active ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600')} />
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

      {/* Decorative plant */}
      <PlantDecoration />

      {/* User + logout */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-3 px-1 py-2.5 rounded-xl bg-gray-50 mb-2">
          <Avatar avatarUrl={profile.avatar_url} name={profile.full_name} size={34} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{profile.full_name}</p>
            <p className="text-[11px] text-gray-400 leading-tight">{roleLabel}</p>
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
