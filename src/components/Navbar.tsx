import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Shield, Globe, Menu, X, Download, Wallet, AlertTriangle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import LanguageSelector from './LanguageSelector'
import toast from 'react-hot-toast'

interface WalletOption {
  name: string
  connector: any
  icon: string
  description?: string
  isInstallOption?: boolean
  downloadUrl?: string
  deepLink?: string
}

const Navbar: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { address, isConnected } = useAccount()
  const { connect, connectors, isLoading, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { user, isAuthenticating, logout, authenticate } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [showWalletModal, setShowWalletModal] = React.useState(false)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [connectionInProgress, setConnectionInProgress] = React.useState(false)

  // Détecter si MetaMask est installé
  const isMetaMaskInstalled = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    return !!(window as any).ethereum?.isMetaMask
  }, [])

  // Détecter si on est sur mobile
  const isMobile = React.useMemo(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }, [])

  // Use the connectors from wagmi config instead of creating new ones
  const getAvailableWallets = React.useCallback((): WalletOption[] => {
    const wallets: WalletOption[] = []
    
    // Map wagmi connectors to wallet options
    connectors.forEach((connector) => {
      if (connector.ready || connector.id === 'walletConnect') {
        let icon = '💼'
        let name = connector.name
        let description = ''
        let deepLink = ''
        
        // Customize based on connector type
        switch (connector.id) {
          case 'metaMask':
            icon = '🦊'
            name = 'MetaMask'
            if (isMobile) {
              deepLink = 'https://metamask.app.link/dapp/'
            }
            break
          case 'walletConnect':
            icon = '🔗'
            name = 'WalletConnect'
            description = isMobile ? 'Connectez 200+ wallets mobiles' : 'Scanner avec votre wallet mobile'
            break
          case 'coinbaseWallet':
            icon = '🔵'
            name = 'Coinbase Wallet'
            if (isMobile) {
              deepLink = 'https://go.cb-w.com/dapp?cb_url='
            }
            break
          case 'injected':
            // Skip generic injected if we have specific ones
            if (connectors.some(c => c.id === 'metaMask' && c.ready)) {
              return
            }
            icon = '💼'
            name = 'Wallet injecté'
            break
        }
        
        wallets.push({
          name,
          connector,
          icon,
          description,
          deepLink
        })
      }
    })
    
    // Add install options for mobile if no wallets detected
    if (isMobile && wallets.length <= 1) {
      wallets.push({
        name: 'MetaMask Mobile',
        connector: null,
        icon: '🦊',
        isInstallOption: true,
        downloadUrl: 'https://metamask.app.link/skAH3BaF99',
        description: 'Installer MetaMask'
      })
      
      wallets.push({
        name: 'Trust Wallet',
        connector: null,
        icon: '🛡️',
        isInstallOption: true,
        downloadUrl: 'https://trustwallet.com/download',
        description: 'Installer Trust Wallet'
      })
    }
    
    return wallets
  }, [connectors, isMobile])

  const availableWallets = getAvailableWallets()
  const hasWallets = availableWallets.some(w => !w.isInstallOption)

  const handleWalletConnect = async (wallet: WalletOption) => {
    // Prevent multiple simultaneous connections
    if (connectionInProgress) {
      toast.error('Connexion en cours, veuillez patienter...')
      return
    }

    if (wallet.isInstallOption) {
      window.open(wallet.downloadUrl, '_blank')
      return
    }
    
    if (!wallet.connector) {
      toast.error('Connecteur non disponible')
      return
    }
    
    try {
      setIsConnecting(true)
      setConnectionInProgress(true)
      
      // Sur mobile, essayer d'ouvrir le wallet via deep link si nécessaire
      if (isMobile && wallet.deepLink && typeof window !== 'undefined' && !window.ethereum) {
        const currentUrl = window.location.href
        window.location.href = wallet.deepLink + encodeURIComponent(currentUrl)
        return
      }

      // Pour WalletConnect, connecter directement sans vérifications supplémentaires
      if (wallet.connector.id === 'walletConnect') {
        const result = await connect({ connector: wallet.connector })
        
        if (result) {
          // Attendre que la connexion soit confirmée
          await new Promise(resolve => setTimeout(resolve, 1000))
          setShowWalletModal(false)
          toast.success(`Connecté avec ${wallet.name}`)
        }
        return
      }

      // Pour les autres wallets, vérifier la disponibilité
      if (typeof window !== 'undefined' && window.ethereum) {
        // Vérifier si une demande est déjà en cours
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        
        if (accounts.length === 0) {
          try {
            // Demander l'autorisation d'accès aux comptes seulement si nécessaire
            await window.ethereum.request({ method: 'eth_requestAccounts' })
          } catch (ethError: any) {
            if (ethError.code === 4001) {
              toast.error('Connexion refusée par l\'utilisateur')
              return
            }
            if (ethError.code === -32002) {
              toast.error('Une demande de connexion est déjà en cours. Veuillez vérifier votre wallet.')
              return
            }
            throw ethError
          }
        }
      }
      
      // Connecter le wallet
      const result = await connect({ connector: wallet.connector })
      
      if (result) {
        // Attendre que la connexion soit confirmée
        await new Promise(resolve => setTimeout(resolve, 1000))
        setShowWalletModal(false)
        toast.success(`Connecté avec ${wallet.name}`)
      }
    } catch (error: any) {
      console.error('Connection error:', error)
      
      if (error.message?.includes('User rejected') || error.message?.includes('rejected') || error.code === 4001) {
        toast.error('Connexion annulée par l\'utilisateur')
      } else if (error.message?.includes('already pending') || error.code === -32002) {
        toast.error('Une demande de connexion est déjà en cours. Veuillez vérifier votre wallet.')
      } else if (error.message?.includes('No provider') || error.message?.includes('not installed')) {
        toast.error(`${wallet.name} n'est pas installé`)
      } else if (error.message?.includes('Already processing')) {
        toast.error('Connexion en cours...')
      } else if (error.message?.includes('JSON-RPC') || error.message?.includes('Internal')) {
        toast.error('Erreur de communication avec le wallet. Veuillez réessayer.')
      } else if (error.message?.includes('Unsupported chain')) {
        toast.error('Réseau non supporté. Veuillez changer de réseau dans votre wallet.')
      } else if (error.message?.includes('Missing or invalid')) {
        toast.error('Configuration du wallet invalide. Veuillez vérifier vos paramètres.')
      } else if (error.message?.includes('Connector not found')) {
        toast.error('Connecteur non trouvé. Veuillez actualiser la page.')
      } else {
        toast.error(`Erreur lors de la connexion: ${error.message || 'Erreur inconnue'}`)
      }
    } finally {
      setIsConnecting(false)
      // Délai pour éviter les connections multiples rapides
      setTimeout(() => setConnectionInProgress(false), 2000)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      if (logout) {
        await logout()
      }
      toast.success('Wallet déconnecté')
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Erreur lors de la déconnexion')
    }
  }

  // Effet pour gérer les erreurs de connexion
  React.useEffect(() => {
    if (error) {
      toast.error(`Erreur de connexion: ${error.message}`)
    }
  }, [error])

  // Nettoyer le flag de connexion si la connexion est annulée
  React.useEffect(() => {
    if (!isLoading && !isConnected && connectionInProgress) {
      setTimeout(() => setConnectionInProgress(false), 1000)
    }
  }, [isLoading, isConnected, connectionInProgress])

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/verify', label: t('nav.verify') },
    { path: '/gallery', label: t('nav.gallery') },
  ]

  if (isConnected && user) {
    navItems.push({ path: '/dashboard', label: t('nav.dashboard') })
  }

  const isLoading_ = isLoading || isConnecting || isAuthenticating

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CertifyWeb3
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSelector />
              
              {/* No wallet warning */}
              {!isMetaMaskInstalled && !isMobile && (
                <div className="flex items-center space-x-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>MetaMask requis</span>
                </div>
              )}
              
              {isConnected && user ? (
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-600">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="btn-secondary text-sm"
                  >
                    {t('nav.disconnect')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowWalletModal(true)}
                  disabled={isLoading_ || connectionInProgress}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isLoading_ ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Connexion...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" />
                      <span>{t('nav.connect')}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-700 hover:text-blue-600"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-gray-200"
            >
              <div className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-sm font-medium transition-colors duration-200 ${
                      location.pathname === item.path
                        ? 'text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <LanguageSelector />
                  
                  {isConnected && user ? (
                    <div className="flex flex-col space-y-2">
                      <div className="text-sm text-gray-600">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </div>
                      <button
                        onClick={handleDisconnect}
                        className="btn-secondary text-sm"
                      >
                        {t('nav.disconnect')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowWalletModal(true)}
                      disabled={isLoading_ || connectionInProgress}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {isLoading_ ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Connexion...</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4" />
                          <span>{t('nav.connect')}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Connecter un wallet</h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isConnecting || connectionInProgress}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Warning si MetaMask n'est pas installé */}
            {!isMetaMaskInstalled && !isMobile && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">MetaMask non détecté</p>
                    <p className="text-sm text-orange-700">Installez MetaMask pour une meilleure expérience</p>
                  </div>
                </div>
                <button
                  onClick={() => window.open('https://metamask.io/download/', '_blank')}
                  className="mt-2 text-sm text-orange-600 hover:text-orange-700 underline"
                >
                  Installer MetaMask
                </button>
              </div>
            )}
            
            <div className="space-y-3">
              {availableWallets.map((wallet, index) => (
                <button
                  key={index}
                  onClick={() => handleWalletConnect(wallet)}
                  disabled={isConnecting || connectionInProgress}
                  className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors disabled:opacity-50 ${
                    wallet.isInstallOption 
                      ? 'border-orange-200 bg-orange-50 hover:bg-orange-100' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="text-left">
                      <div className="font-medium">{wallet.name}</div>
                      {wallet.description && (
                        <div className="text-sm text-gray-500">{wallet.description}</div>
                      )}
                    </div>
                  </div>
                  {wallet.isInstallOption && (
                    <Download className="h-4 w-4 text-orange-600" />
                  )}
                  {(isConnecting || connectionInProgress) && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                </button>
              ))}
              
              {availableWallets.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Aucun wallet détecté</p>
                  <button
                    onClick={() => window.open('https://metamask.io/download/', '_blank')}
                    className="btn-primary"
                  >
                    Installer MetaMask
                  </button>
                </div>
              )}
            </div>

            {connectionInProgress && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Connexion en cours... Veuillez vérifier votre wallet.
              </div>
            )}
          </motion.div>
        </div>
      )}
    </>
  )
}

export default Navbar