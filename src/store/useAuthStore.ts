import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  address: string
  companyName?: string
  companyDescription?: string
  contractAddress?: string
  isVerified: boolean
}

interface AuthState {
  user: User | null
  isConnected: boolean
  setUser: (user: User | null) => void
  setConnected: (connected: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isConnected: false,
      setUser: (user) => set({ user }),
      setConnected: (connected) => set({ isConnected: connected }),
      logout: () => set({ user: null, isConnected: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)