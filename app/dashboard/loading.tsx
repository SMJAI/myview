import { SkeletonBanner, SkeletonCard, SkeletonTable } from '@/components/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <SkeletonBanner />
      <div>
        <div className="h-3 w-40 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
      <div>
        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mb-3" />
        <SkeletonTable rows={3} cols={4} />
      </div>
    </div>
  )
}
