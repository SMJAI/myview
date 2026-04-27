'use server'

import { createAdminClient } from './supabase/admin'

export async function createNotification({
  userId,
  title,
  body,
  type = 'info',
  link,
}: {
  userId: string
  title: string
  body?: string
  type?: string
  link?: string
}) {
  try {
    const adminClient = createAdminClient()
    await adminClient.from('notifications').insert({
      user_id: userId,
      title,
      body: body ?? null,
      type,
      link: link ?? null,
    })
  } catch {
    // Notifications are non-critical — never throw
  }
}

export async function createNotificationsForManagers({
  title,
  body,
  type = 'info',
  link,
}: {
  title: string
  body?: string
  type?: string
  link?: string
}) {
  try {
    const adminClient = createAdminClient()
    const { data: managers } = await adminClient
      .from('profiles')
      .select('id')
      .in('role', ['manager', 'hr_admin'])

    if (!managers || managers.length === 0) return

    await adminClient.from('notifications').insert(
      managers.map((m) => ({
        user_id: m.id,
        title,
        body: body ?? null,
        type,
        link: link ?? null,
      }))
    )
  } catch {
    // Non-critical
  }
}
