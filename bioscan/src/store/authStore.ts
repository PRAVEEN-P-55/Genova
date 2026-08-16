import { create } from 'zustand'
import type { User, UserRole } from '../types'
import { authApi } from '../services/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  loginWithBackend: (role: UserRole) => Promise<void>
  logout: () => void
}

// Demo users fallback
export const DEMO_USERS: Record<UserRole, User> = {
  researcher: {
    user_id: 'usr-res-01',
    name: 'Dr. Priya Sharma',
    email: 'researcher@genova.ai',
    role: 'researcher',
    organization: 'Wildlife Institute of India (WII)',
  },
  authority: {
    user_id: 'usr-auth-01',
    name: 'Rajesh Verma, IFS',
    email: 'authority@genova.ai',
    role: 'authority',
    organization: 'National Biodiversity Authority (NBA)',
  },
  lab_technician: {
    user_id: 'usr-tech-01',
    name: 'Ananya Sen',
    email: 'tech@genova.ai',
    role: 'lab_technician',
    organization: 'Centre for Cellular & Molecular Biology (CCMB)',
  },
  admin: {
    user_id: 'usr-adm-01',
    name: 'Admin Officer',
    email: 'admin@genova.ai',
    role: 'admin',
    organization: 'Ministry of Environment, Forest & CC',
  },
  public: {
    user_id: 'usr-pub-01',
    name: 'Citizen Observer',
    email: 'public@genova.ai',
    role: 'public',
  },
}

function loadAuth(): Pick<AuthState, 'user' | 'token' | 'isAuthenticated'> {
  try {
    const stored = sessionStorage.getItem('genova-auth')
    if (stored) return JSON.parse(stored)
  } catch {}
  return { user: null, token: null, isAuthenticated: false }
}

function saveAuth(state: Pick<AuthState, 'user' | 'token' | 'isAuthenticated'>) {
  try {
    sessionStorage.setItem('genova-auth', JSON.stringify(state))
  } catch {}
}

export const useAuthStore = create<AuthState>()((set) => ({
  ...loadAuth(),
  login: (user, token) => {
    const next = { user, token, isAuthenticated: true }
    sessionStorage.setItem('genova-token', token)
    saveAuth(next)
    set(next)
  },
  loginWithBackend: async (role: UserRole) => {
    try {
      const data = await authApi.login(role)
      if (data.success && data.user) {
        const next = { user: data.user, token: data.token, isAuthenticated: true }
        saveAuth(next)
        set(next)
        return
      }
    } catch (e) {
      console.warn('[Auth] Backend login fallback to local profile:', e)
    }

    // Graceful fallback
    const user = DEMO_USERS[role]
    const token = `demo-token-${Date.now()}`
    const next = { user, token, isAuthenticated: true }
    saveAuth(next)
    set(next)
  },
  logout: () => {
    sessionStorage.removeItem('genova-token')
    const next = { user: null, token: null, isAuthenticated: false }
    saveAuth(next)
    set(next)
  },
}))
