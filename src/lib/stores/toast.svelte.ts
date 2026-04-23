export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

class ToastStore {
  toasts = $state<Toast[]>([])

  add(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).slice(2)
    const duration = toast.duration ?? 4000
    this.toasts = [...this.toasts, { ...toast, id }]
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration)
    }
    return id
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id)
  }

  success(title: string, message?: string) {
    return this.add({ type: 'success', title, message })
  }

  error(title: string, message?: string) {
    return this.add({ type: 'error', title, message, duration: 6000 })
  }

  warning(title: string, message?: string) {
    return this.add({ type: 'warning', title, message })
  }

  info(title: string, message?: string) {
    return this.add({ type: 'info', title, message })
  }
}

export const toast = new ToastStore()
