'use server'

import { createClient } from '@/lib/supabase/server'
import { ask } from '@/lib/ai'

// ── Feature 2: Suggest leave type based on reason text ──────────────────────
export async function suggestLeaveType(
  reason: string,
  leaveTypes: { id: string; name: string }[]
): Promise<string | null> {
  if (!reason || reason.length < 8 || !process.env.ANTHROPIC_API_KEY) return null
  try {
    const result = await ask(
      `An employee wrote this reason for a leave request: "${reason}"
Available leave types: ${leaveTypes.map(lt => lt.name).join(', ')}
Reply with ONLY the single most appropriate leave type name from the list, nothing else.`
    )
    const match = leaveTypes.find(lt => lt.name.toLowerCase() === result.toLowerCase())
    return match?.id ?? null
  } catch { return null }
}

// ── Feature 3: Detect absence patterns across all employees ──────────────────
export async function detectAbsencePatterns(): Promise<string[]> {
  if (!process.env.ANTHROPIC_API_KEY) return []
  try {
    const supabase = await createClient()
    const { data: requests } = await supabase
      .from('leave_requests')
      .select('user_id, start_date, end_date, days_count, status, profiles!user_id(full_name), leave_types(name)')
      .in('status', ['approved', 'pending'])
      .gte('start_date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
      .order('start_date')

    if (!requests || requests.length === 0) return []

    const summary = requests.map(r => {
      const dow = new Date(r.start_date).toLocaleDateString('en-GB', { weekday: 'long' })
      return `${(r.profiles as { full_name?: string } | null)?.full_name}: ${(r.leave_types as { name?: string } | null)?.name}, ${r.start_date} (${dow}) → ${r.end_date}, ${r.days_count}d, ${r.status}`
    }).join('\n')

    const result = await ask(
      `Analyse this year's leave data for a small physiotherapy clinic team and identify 3-4 notable patterns or insights.
Be specific and concise — each insight max 15 words. Focus on: day-of-week trends, clustering, high usage, coverage risks.
Data:\n${summary}
Reply with a JSON array of strings only, e.g. ["insight 1", "insight 2"]`,
      false
    )

    const parsed = JSON.parse(result.match(/\[[\s\S]*\]/)?.[0] ?? '[]')
    return Array.isArray(parsed) ? parsed.slice(0, 4) : []
  } catch { return [] }
}

// ── Feature 4: Coverage risk check for a specific date range ─────────────────
export async function checkCoverageRisk(
  startDate: string,
  endDate: string,
  requestId: string
): Promise<{ risk: boolean; message: string | null }> {
  try {
    const supabase = await createClient()
    const { data: overlapping } = await supabase
      .from('leave_requests')
      .select('user_id, start_date, end_date, profiles!user_id(full_name)')
      .eq('status', 'approved')
      .neq('id', requestId)
      .lte('start_date', endDate)
      .gte('end_date', startDate)

    const count = overlapping?.length ?? 0
    if (count === 0) return { risk: false, message: null }

    const names = overlapping!
      .map(r => (r.profiles as { full_name?: string } | null)?.full_name)
      .filter(Boolean)
      .join(', ')

    if (count >= 2) {
      return {
        risk: true,
        message: `⚠️ ${count} team member${count > 1 ? 's' : ''} already approved for overlapping dates: ${names}.`,
      }
    }
    return {
      risk: false,
      message: `ℹ️ ${names} is also off during part of this period.`,
    }
  } catch { return { risk: false, message: null } }
}

// ── Feature 5: Draft a professional manager note ──────────────────────────────
export async function draftManagerNote(
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  daysCount: number,
  status: 'approved' | 'rejected'
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return ''
  try {
    return await ask(
      `Write a brief, professional manager note (1-2 sentences, warm but clear) for a leave request decision.
Employee: ${employeeName}
Leave type: ${leaveType}
Dates: ${startDate} to ${endDate} (${daysCount} days)
Decision: ${status}
Reply with ONLY the note text, no quotes, no labels.`
    )
  } catch { return '' }
}
