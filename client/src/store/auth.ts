import { create } from 'zustand'
import { api } from '../api/client'
import type { AdminRole } from '../api/client'

type AuthState = {
  loading: boolean
  authenticated: boolean
  pending: boolean
  needs2FASetup: boolean
  needs2FAVerify: boolean
  id?: string
  username?: string
  role?: AdminRole
  totpEnabled?: boolean
  refresh: () => Promise<void>
  login: (
    username: string,
    password: string
  ) => Promise<{ authenticated: boolean; needs2FASetup: boolean; needs2FAVerify: boolean }>
  setup2FA: () => Promise<{ qrDataUrl: string; secret: string }>
  verify2FA: (token: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  loading: true,
  authenticated: false,
  pending: false,
  needs2FASetup: false,
  needs2FAVerify: false,

  refresh: async () => {
    try {
      const { data } = await api.get('/auth/me')
      if (data.authenticated) {
        set({
          loading: false,
          authenticated: true,
          pending: false,
          needs2FASetup: false,
          needs2FAVerify: false,
          id: data.id,
          username: data.username,
          role: data.role,
          totpEnabled: data.totpEnabled,
        })
      } else if (data.pending) {
        set({
          loading: false,
          authenticated: false,
          pending: true,
          needs2FASetup: !!data.needs2FASetup,
          needs2FAVerify: !!data.needs2FAVerify,
          username: data.username,
        })
      } else {
        set({
          loading: false,
          authenticated: false,
          pending: false,
          needs2FASetup: false,
          needs2FAVerify: false,
          id: undefined,
          username: undefined,
          role: undefined,
        })
      }
    } catch {
      set({ loading: false, authenticated: false, pending: false })
    }
  },

  login: async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password })
    if (data.authenticated) {
      await get().refresh()
      return { authenticated: true, needs2FASetup: false, needs2FAVerify: false }
    }
    set({
      pending: true,
      authenticated: false,
      needs2FASetup: !!data.needs2FASetup,
      needs2FAVerify: !!data.needs2FAVerify,
      username,
    })
    return { authenticated: false, needs2FASetup: !!data.needs2FASetup, needs2FAVerify: !!data.needs2FAVerify }
  },

  setup2FA: async () => {
    const { data } = await api.post('/auth/2fa/setup')
    return data
  },

  verify2FA: async (token: string) => {
    await api.post('/auth/2fa/verify', { token })
    await get().refresh()
  },

  logout: async () => {
    await api.post('/auth/logout')
    set({
      authenticated: false,
      pending: false,
      needs2FASetup: false,
      needs2FAVerify: false,
      id: undefined,
      username: undefined,
      role: undefined,
    })
  },
}))
