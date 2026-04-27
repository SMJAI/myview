'use client'

import Link from 'next/link'
import { Bell, Settings } from 'lucide-react'
import { Avatar } from './avatar'
import type { Profile } from '@/lib/types'

interface HeaderProps {
  profile: Profile
  notificationCount: number
}

export function Header({ profile, notificationCount }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-end gap-1 px-6 sticky top-0 z-20 shrink-0">
      <Link
        href="/dashboard/notifications"
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {notificationCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 leading-none">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </Link>

      <button
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Settings"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5 text-gray-500" />
      </button>

      <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-gray-100">
        <Avatar avatarUrl={profile.avatar_url} name={profile.full_name} size={32} />
        <span className="text-sm font-medium text-gray-800 hidden sm:block">{profile.full_name}</span>
      </div>
    </header>
  )
}
