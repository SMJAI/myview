import { SkeletonTable } from '@/components/skeleton'

export default function ManagerRequestsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-36 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
      </div>
      <SkeletonTable rows={6} cols={7} />
    </div>
  )
}
