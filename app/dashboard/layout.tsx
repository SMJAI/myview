import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'
import { Toaster } from '@/components/toaster'
import type { Profile } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Unknown'

    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: fullName,
        role: 'employee',
        avatar_url: user.user_metadata?.avatar_url ?? null,
      })
      .select('*')
      .single()

    profile = newProfile
  } else if (!profile.avatar_url && user.user_metadata?.avatar_url) {
    // Backfill avatar_url from Google OAuth if missing
    await supabase
      .from('profiles')
      .update({ avatar_url: user.user_metadata.avatar_url })
      .eq('id', user.id)
    profile = { ...profile, avatar_url: user.user_metadata.avatar_url }
  }

  if (!profile) redirect('/login')

  const canSeeManagerNav = profile.role === 'manager' || profile.role === 'hr_admin'

  const [pendingResult, notificationResult] = await Promise.all([
    canSeeManagerNav
      ? supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
  ])

  const pendingCount = (pendingResult as { count: number | null }).count ?? 0
  const notificationCount = notificationResult.count ?? 0

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile as Profile} pendingCount={pendingCount} notificationCount={notificationCount} />
      <main className="flex-1 overflow-y-auto" style={{ background: '#f6faf8' }}>
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
      <Toaster />
    </div>
  )
}
