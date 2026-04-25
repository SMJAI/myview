import { SkeletonTable } from '@/components/skeleton'

export default function RequestsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-44 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <SkeletonTable rows={5} cols={6} />
    </div>
  )
}
