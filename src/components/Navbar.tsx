import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { Shield, Globe, Menu, X, Download } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import LanguageSelector from './LanguageSelector'
import toast from 'react-hot-toast'

const Navbar: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  })
  const { disconnect } = useDisconnect()
  const { user, isAuthenticating, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const handleConnect = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        toast.error('MetaMask n\'est pas installé. Veuillez l\'installer pour continuer.')
        // Open MetaMask download page
        window.open('https://metamask.io/download/', '_blank')
        return
      }

      await connect()
    } catch (error: any) {
      console.error('Connection error:', error)
      toast.error('Erreur lors de la connexion au wallet')
    }
  }

  const handleDisconnect = () => {
    disconnect()
    logout()
    toast.success('Wallet déconnecté')
  }

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/verify', label: t('nav.verify') },
    { path: '/gallery', label: t('nav.gallery') },
  ]

  if (isConnected && user) {
    navItems.push({ path: '/dashboard', label: t('nav.dashboard') })
  }

  return (
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
            
            {/* MetaMask not installed warning */}
            {typeof window.ethereum === 'undefined' && (
              <div className="flex items-center space-x-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm">
                <Download className="h-4 w-4" />
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
                onClick={handleConnect}
                disabled={isAuthenticating}
                className="btn-primary flex items-center space-x-2"
              >
                {isAuthenticating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Connexion...</span>
                  </>
                ) : (
                  <span>{t('nav.connect')}</span>
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
                
                {/* MetaMask warning for mobile */}
                {typeof window.ethereum === 'undefined' && (
                  <button
                    onClick={() => window.open('https://metamask.io/download/', '_blank')}
                    className="flex items-center space-x-2 bg-orange-50 text-orange-700 px-3 py-2 rounded-lg text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Installer MetaMask</span>
                  </button>
                )}
                
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
                    onClick={handleConnect}
                    disabled={isAuthenticating}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isAuthenticating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Connexion...</span>
                      </>
                    ) : (
                      <span>{t('nav.connect')}</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}

export default Navbar