export function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <SkeletonPulse className="w-2.5 h-2.5 rounded-full" />
        <SkeletonPulse className="h-3 w-24" />
      </div>
      <SkeletonPulse className="h-8 w-14 mb-1" />
      <SkeletonPulse className="h-3 w-32 mb-3" />
      <SkeletonPulse className="h-1.5 w-full rounded-full" />
    </div>
  )
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  const widths = ['w-28', 'w-20', 'w-20', 'w-8', 'w-16']
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <SkeletonPulse className={`h-4 ${widths[i] ?? 'w-20'}`} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-5 py-3 text-left">
                <SkeletonPulse className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonBanner() {
  return <SkeletonPulse className="h-28 w-full rounded-2xl" />
}
