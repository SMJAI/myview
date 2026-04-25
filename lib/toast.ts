export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

type Listener = (toast: Toast) => void
const listeners: Listener[] = []

export const toastBus = {
  subscribe(fn: Listener) {
    listeners.push(fn)
    return () => {
      const idx = listeners.indexOf(fn)
      if (idx > -1) listeners.splice(idx, 1)
    }
  },
  emit(toast: Toast) {
    listeners.forEach(fn => fn(toast))
  },
}

export function toast(message: string, type: ToastType = 'success') {
  toastBus.emit({ id: Date.now(), message, type })
}
