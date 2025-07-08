import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { Shield, Globe, Menu, X } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import LanguageSelector from './LanguageSelector'

const Navbar: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  })
  const { disconnect } = useDisconnect()
  const { user, setUser, setConnected, logout } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  React.useEffect(() => {
    if (isConnected && address) {
      setUser({ address, isVerified: false })
      setConnected(true)
    } else {
      logout()
    }
  }, [isConnected, address, setUser, setConnected, logout])

  const handleConnect = () => {
    connect()
  }

  const handleDisconnect = () => {
    disconnect()
    logout()
  }

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/verify', label: t('nav.verify') },
    { path: '/gallery', label: t('nav.gallery') },
  ]

  if (isConnected) {
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
            
            {isConnected ? (
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
                className="btn-primary"
              >
                {t('nav.connect')}
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
                
                {isConnected ? (
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
                    className="btn-primary"
                  >
                    {t('nav.connect')}
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