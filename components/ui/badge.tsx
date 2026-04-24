import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'neutral'
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-blue-100 text-blue-800': variant === 'default',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-red-100 text-red-800': variant === 'danger',
          'bg-yellow-100 text-yellow-800': variant === 'warning',
          'bg-gray-100 text-gray-600': variant === 'neutral',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
