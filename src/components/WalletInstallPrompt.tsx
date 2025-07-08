import React from 'react'
import { motion } from 'framer-motion'
import { Download, ExternalLink, Shield } from 'lucide-react'

interface WalletInstallPromptProps {
  isOpen: boolean
  onClose: () => void
}

const WalletInstallPrompt: React.FC<WalletInstallPromptProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const handleInstallMetaMask = () => {
    window.open('https://metamask.io/download/', '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl p-8 max-w-md w-full"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-6">
            <Download className="h-8 w-8 text-orange-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Wallet requis
          </h3>
          
          <p className="text-gray-600 mb-6">
            Pour utiliser CertifyWeb3, vous devez installer MetaMask ou un autre wallet compatible Web3.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={handleInstallMetaMask}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Installer MetaMask</span>
              <ExternalLink className="h-4 w-4" />
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Fermer
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Pourquoi un wallet ?
                </p>
                <p className="text-sm text-blue-700">
                  Les wallets permettent de signer et vérifier vos certificats sur la blockchain de manière sécurisée.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default WalletInstallPrompt