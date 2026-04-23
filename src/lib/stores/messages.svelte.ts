import api from '$lib/api'

class MessageStore {
  unreadCount = $state(0)
  // Map demandeId → nombre de messages non lus
  unreadByDemande = $state<Record<number, number>>({})

  async loadUnread() {
    try {
      const { auth } = await import('$lib/stores/auth.svelte')
      const role = auth.user?.role
      const userId = auth.user?.id
      if (!userId) return

      let demandes: any[] = []
      if (role === 'client') {
        const res = await api.get('/demandes')
        demandes = res.data ?? []
      } else if (role === 'entreprise') {
        const res = await api.get('/appels-offres')
        demandes = (res.data.data ?? [])
          .map((ao: any) => ({ id: ao.demande?.id ?? ao.demandeId }))
          .filter((d: any) => d.id)
      } else if (role === 'admin') {
        const res = await api.get('/admin/demandes?limit=50')
        demandes = res.data.data ?? []
      }

      const map: Record<number, number> = {}
      let total = 0

      await Promise.all(
        demandes.slice(0, 15).map(async (d: any) => {
          try {
            const res = await api.get(`/demandes/${d.id}/messages`)
            const msgs: any[] = res.data ?? []
            const count = msgs.filter(
              (m) => !m.lu && (m.receiverId === userId || m.receiver_id === userId)
            ).length
            if (count > 0) {
              map[d.id] = count
              total += count
            }
          } catch {}
        })
      )

      this.unreadByDemande = map
      this.unreadCount = total
    } catch {}
  }

  markDemandeRead(demandeId: number) {
    const count = this.unreadByDemande[demandeId] ?? 0
    if (count > 0) {
      const updated = { ...this.unreadByDemande }
      delete updated[demandeId]
      this.unreadByDemande = updated
      this.unreadCount = Math.max(0, this.unreadCount - count)
    }
  }
}

export const msgStore = new MessageStore()
