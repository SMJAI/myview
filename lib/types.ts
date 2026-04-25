export type Role = 'employee' | 'manager' | 'hr_admin'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  start_date: string | null
  weekly_hours: number | null
  created_at: string
  updated_at: string
}

export function canManageUsers(role: Role) {
  return role === 'manager' || role === 'hr_admin'
}

export function canApproveLeave(role: Role) {
  return role === 'manager' || role === 'hr_admin'
}

export interface LeaveType {
  id: string
  name: string
  default_days: number
  color: string
  is_default: boolean
  show_in_balances: boolean
}

export interface LeaveBalance {
  id: string
  user_id: string
  leave_type_id: string
  year: number
  total_days: number
  used_days: number
  leave_types?: LeaveType
  profiles?: Profile
}

export interface LeaveRequest {
  id: string
  user_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days_count: number
  reason: string | null
  document_path: string | null
  status: LeaveStatus
  manager_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  profiles?: Profile
  leave_types?: LeaveType
  reviewer?: Profile
}
