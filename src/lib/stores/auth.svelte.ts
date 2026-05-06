export type UserRole = 'client' | 'entreprise' | 'admin'

export interface AuthUser {
  id: number
  fullName: string | null
  email: string
  telephone: string | null
  role: UserRole
  userType: string | null
  isActive: boolean
  initials: string
  avatarUrl?: string | null
}

// Utilisation d'un objet simple pour éviter les problèmes SSR avec $state au niveau module
class AuthStore {
  user = $state<AuthUser | null>(null)
  token = $state<string | null>(null)
  loading = $state(false)

  init() {
    if (typeof sessionStorage === 'undefined') return
    const stored = sessionStorage.getItem('auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        this.user = parsed.user
        this.token = parsed.token
      } catch {}
    }
  }

  login(u: AuthUser, t: string) {
    this.user = u
    this.token = t
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('auth', JSON.stringify({ user: u, token: t }))
    }
  }

  logout() {
    this.user = null
    this.token = null
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('auth')
    }
  }

  // Met à jour les données user et persiste dans sessionStorage
  update(partial: Partial<AuthUser>) {
    if (!this.user) return
    this.user = { ...this.user, ...partial }
    if (typeof sessionStorage !== 'undefined' && this.token) {
      sessionStorage.setItem('auth', JSON.stringify({ user: this.user, token: this.token }))
    }
  }

  getToken() {
    return this.token
  }

  getUser() {
    return this.user
  }

  isAuthenticated() {
    return !!this.token && !!this.user
  }
}

export const auth = new AuthStore()
