'use client'

import { useEffect, useState } from 'react'
import { detectAbsencePatterns } from '@/app/dashboard/ai-actions'
import { Sparkles } from 'lucide-react'

export function AbsenceInsights() {
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    detectAbsencePatterns().then(r => { setInsights(r); setLoading(false) })
  }, [])

  if (!loading && insights.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-brand-100 overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50"
        style={{ background: 'linear-gradient(135deg, #f0fdf8, #ffffff)' }}>
        <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <p className="text-sm font-semibold text-gray-800">AI Absence Insights</p>
        <span className="ml-auto text-[10px] text-gray-400 uppercase tracking-wide">This year</span>
      </div>

      <div className="px-5 py-4 space-y-2.5">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: `${60 + i * 10}%` }} />
            ))}
          </>
        ) : (
          insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0 mt-1.5" />
              <p className="text-sm text-gray-700 leading-snug">{insight}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
