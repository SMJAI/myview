'use client'

import { useEffect, useState } from 'react'
import { toastBus, type Toast } from '@/lib/toast'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    return toastBus.subscribe(toast => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, 4000)
    })
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 min-w-72 max-w-sm animate-[slideIn_0.2s_ease-out]"
        >
          {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
          {t.type === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
          {t.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
          <p className="text-sm text-gray-800 flex-1">{t.message}</p>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
