import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import type { Notification as AppNotification } from '@/lib/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const TYPE_STYLE: Record<string, { dot: string; icon: string }> = {
  approved:    { dot: 'bg-green-500',  icon: '✓' },
  rejected:    { dot: 'bg-red-500',    icon: '✗' },
  new_request: { dot: 'bg-brand-500',  icon: '!' },
  info:        { dot: 'bg-gray-400',   icon: '·' },
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Mark all unread as read (sidebar count updates on next navigation)
  const hasUnread = (notifications ?? []).some((n: AppNotification) => !n.read)
  if (hasUnread) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">Updates on your leave requests and team activity</p>
        </div>
        {hasUnread && (
          <div className="flex items-center gap-1.5 text-xs text-brand-600">
            <CheckCheck className="w-3.5 h-3.5" />
            Marked all as read
          </div>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {(notifications as AppNotification[]).map((n) => {
            const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.info
            return (
              <div key={n.id} className={`px-5 py-4 flex gap-4 ${!n.read ? 'bg-brand-50/40' : ''}`}>
                <div className="mt-1 shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${!n.read ? style.dot : 'bg-gray-200'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm font-medium ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(n.created_at)}</span>
                  </div>
                  {n.body && (
                    <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                  )}
                  {n.link && (
                    <Link
                      href={n.link}
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline mt-1"
                    >
                      View details
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
