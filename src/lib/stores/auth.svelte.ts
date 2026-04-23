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
}

// Utilisation d'un objet simple pour éviter les problèmes SSR avec $state au niveau module
class AuthStore {
  user = $state<AuthUser | null>(null)
  token = $state<string | null>(null)
  loading = $state(false)

  init() {
    if (typeof localStorage === 'undefined') return
    const stored = localStorage.getItem('auth')
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
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth', JSON.stringify({ user: u, token: t }))
    }
  }

  logout() {
    this.user = null
    this.token = null
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth')
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
