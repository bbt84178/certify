import { useState, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { user, setUser, setConnected, logout } = useAuthStore()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => {
    if (isConnected && address) {
      authenticateUser(address)
    } else {
      logout()
    }
  }, [isConnected, address])

  const authenticateUser = async (walletAddress: string) => {
    try {
      setIsAuthenticating(true)
      
      // Check if already authenticated
      const token = localStorage.getItem('auth_token')
      if (token) {
        try {
          const response = await authAPI.getMe()
          setUser(response.data)
          setConnected(true)
          return
        } catch (error) {
          // Token invalid, continue with authentication
          localStorage.removeItem('auth_token')
        }
      }

      // Get nonce
      const nonceResponse = await authAPI.getNonce(walletAddress)
      const { nonce } = nonceResponse.data

      // Sign message
      const message = `Sign this message to authenticate with CertifyWeb3. Nonce: ${nonce}`
      const signature = await signMessageAsync({ message })

      // Verify signature
      const verifyResponse = await authAPI.verify(walletAddress, signature)
      const { token, user: userData } = verifyResponse.data

      // Store token and user data
      localStorage.setItem('auth_token', token)
      setUser(userData)
      setConnected(true)
      
      toast.success('Successfully authenticated!')
    } catch (error: any) {
      console.error('Authentication error:', error)
      toast.error(error.response?.data?.error || 'Authentication failed')
      logout()
    } finally {
      setIsAuthenticating(false)
    }
  }

  return {
    user,
    isConnected,
    isAuthenticating,
    authenticateUser,
    logout
  }
}