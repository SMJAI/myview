import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-600'
    default:
      return 'bg-yellow-100 text-yellow-800'
  }
}

export function countWorkingDays(
  start: string,
  end: string,
  bankHolidays: string[] = []
): number {
  const bhSet = new Set(bankHolidays)
  const startDate = new Date(start)
  const endDate = new Date(end)
  let count = 0
  const current = new Date(startDate)
  while (current <= endDate) {
    const day = current.getDay()
    const iso = current.toISOString().split('T')[0]
    if (day !== 0 && day !== 6 && !bhSet.has(iso)) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}
