import { Badge } from '@/components/ui/badge'
import type { LeaveStatus } from '@/lib/types'

export function StatusBadge({ status }: { status: LeaveStatus }) {
  const map: Record<LeaveStatus, { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' }> = {
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    pending: { label: 'Pending', variant: 'warning' },
    cancelled: { label: 'Cancelled', variant: 'neutral' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}
