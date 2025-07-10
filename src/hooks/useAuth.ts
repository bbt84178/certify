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

  // Fonction d'authentification
  const authenticate = async () => {
    if (!address || !isConnected) {
      console.log('❌ No address or not connected')
      return
    }

    try {
      setIsAuthenticating(true)
      console.log('🔐 Starting authentication for:', address)
      
      // Check if backend is available first
      try {
        await authAPI.healthCheck()
      } catch (healthError) {
        console.error('❌ Backend server not available:', healthError)
        toast.error('Serveur non disponible. Vérifiez que le backend est démarré.')
        return null
      }
      
      // Vérifier si on a déjà un token valide
      const token = localStorage.getItem('auth_token')
      if (token) {
        try {
          console.log('🔍 Checking existing token...')
          const response = await authAPI.getProfile()
          console.log('✅ Token valid, user authenticated:', response.data.user)
          setUser(response.data.user)
          setConnected(true)
          return response.data.user
        } catch (error) {
          console.log('❌ Token invalid, removing:', error.response?.status)
          localStorage.removeItem('auth_token')
        }
      }

      // Étape 1: Récupérer le nonce
      console.log('📝 Getting nonce for:', address)
      const nonceResponse = await authAPI.getNonce(address)
      const { nonce, message } = nonceResponse.data
      console.log('✅ Nonce received:', nonce)

      // Étape 2: Signer le message
      console.log('✍️ Signing message...')
      const signature = await signMessageAsync({ message })
      console.log('✅ Message signed')

      // Étape 3: Vérifier la signature
      console.log('🔐 Verifying signature...')
      const verifyResponse = await authAPI.verify(address, signature, message)
      const { accessToken, user: userData } = verifyResponse.data
      console.log('✅ Signature verified, user authenticated:', userData)

      // Étape 4: Stocker le token et les données utilisateur
      localStorage.setItem('auth_token', accessToken)
      setUser(userData)
      setConnected(true)
      
      toast.success('Authentification réussie!')
      return userData

    } catch (error: any) {
      console.error('❌ Authentication error:', error)
      
      // Gestion des erreurs spécifiques
      if (error.code === 4001) {
        toast.error('Signature refusée par l\'utilisateur')
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        toast.error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré.')
      } else if (error.response?.status === 404) {
        toast.error('Erreur de nonce. Veuillez réessayer.')
      } else if (error.response?.status === 401) {
        toast.error('Signature invalide')
      } else if (error.response?.status >= 500) {
        toast.error('Erreur serveur. Veuillez réessayer plus tard.')
      } else {
        toast.error(error.response?.data?.error || 'Erreur d\'authentification')
      }
      
      logout()
      return null
    } finally {
      setIsAuthenticating(false)
    }
  }

  // Déconnexion
  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('auth_token')
      logout()
      toast.success('Déconnexion réussie')
    }
  }

  // Effet pour gérer l'authentification automatique
  useEffect(() => {
    if (isConnected && address && !user && !isAuthenticating) {
      console.log('🔄 Auto-authenticating for connected wallet:', address)
      authenticate()
    } else if (!isConnected && user) {
      console.log('🔄 Wallet disconnected, logging out')
      handleLogout()
    }
  }, [isConnected, address, user, isAuthenticating])

  // Vérifier le token au chargement
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token && !user && !isAuthenticating) {
      console.log('🔍 Checking stored token on load...')
      authAPI.getProfile()
        .then(response => {
          console.log('✅ Stored token valid:', response.data.user)
          setUser(response.data.user)
          setConnected(true)
        })
        .catch(error => {
          console.log('❌ Stored token invalid:', error.response?.status)
          localStorage.removeItem('auth_token')
        })
    }
  }, [])

  return {
    user,
    isConnected,
    isAuthenticating,
    authenticate,
    logout: handleLogout
  }
}