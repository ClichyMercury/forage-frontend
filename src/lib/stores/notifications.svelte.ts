import api from '$lib/api'

class NotificationStore {
  count = $state(0)
  items = $state<any[]>([])

  async load() {
    try {
      const res = await api.get('/account/notifications')
      this.items = res.data.slice(0, 50)
      this.count = this.items.filter((n: any) => !n.lu).length
    } catch {}
  }

  async markRead(id: number) {
    try {
      await api.patch(`/account/notifications/${id}/read`)
      this.items = this.items.map(n => n.id === id ? { ...n, lu: true } : n)
      this.count = this.items.filter(n => !n.lu).length
    } catch {}
  }

  async markAllRead() {
    try {
      await api.patch('/account/notifications/read-all')
      this.items = this.items.map(n => ({ ...n, lu: true }))
      this.count = 0
    } catch {}
  }
}

export const notifStore = new NotificationStore()
