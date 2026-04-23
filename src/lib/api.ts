import axios from 'axios'
import { auth } from '$lib/stores/auth.svelte'
import { toast } from '$lib/stores/toast.svelte'
import { goto } from '$app/navigation'

export const BASE_URL = 'http://localhost:3333/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Injecter le token automatiquement
api.interceptors.request.use((config) => {
  const token = auth.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Gérer les erreurs globalement
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const message = err.response?.data?.message ?? 'Une erreur est survenue'
    const url = err.config?.url ?? ''

    if (status === 401) {
      // Ne pas déconnecter sur les routes non critiques (notifications, etc.)
      const isCritical = !url.includes('notifications') && !url.includes('messages')
      if (isCritical) {
        auth.logout()
        goto('/login')
        toast.error('Session expirée', 'Veuillez vous reconnecter.')
      }
    } else if (status === 403) {
      // Ne pas afficher d'erreur pour les 403 sur les routes de vérification
      if (!url.includes('notifications')) {
        toast.error('Accès refusé', message)
      }
    } else if (status === 422) {
      // Erreurs de validation — gérées localement
    } else if (status >= 500) {
      toast.error('Erreur serveur', 'Veuillez réessayer plus tard.')
    }

    return Promise.reject(err)
  }
)

export default api
