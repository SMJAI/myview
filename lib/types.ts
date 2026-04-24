export type Role = 'employee' | 'manager'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  created_at: string
  updated_at: string
}

export interface LeaveType {
  id: string
  name: string
  default_days: number
  color: string
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
  status: LeaveStatus
  manager_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  profiles?: Profile
  leave_types?: LeaveType
  reviewer?: Profile
}
