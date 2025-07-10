import { createConfig, configureChains } from 'wagmi'
import { mainnet, sepolia, bsc, bscTestnet, polygon, polygonMumbai } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { infuraProvider } from 'wagmi/providers/infura'
import { alchemyProvider } from 'wagmi/providers/alchemy'

import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'

// Get environment variables with proper fallbacks
const infuraProjectId = import.meta.env.VITE_INFURA_PROJECT_ID
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

// Configure providers based on available API keys
const providers = []

if (infuraProjectId && infuraProjectId !== '' && infuraProjectId !== 'demo') {
  providers.push(infuraProvider({ apiKey: infuraProjectId }))
}

if (alchemyApiKey && alchemyApiKey !== '' && alchemyApiKey !== 'demo') {
  providers.push(alchemyProvider({ apiKey: alchemyApiKey }))
}

// Always include public provider as fallback
providers.push(publicProvider())

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, sepolia, bsc, bscTestnet, polygon, polygonMumbai],
  providers
)

// Only configure WalletConnect if we have a valid project ID
const hasValidWalletConnectId = walletConnectProjectId && 
  walletConnectProjectId !== '' && 
  walletConnectProjectId !== 'demo' &&
  walletConnectProjectId !== 'your_walletconnect_project_id'

// Configure connectors
const connectors = []

// Add MetaMask connector
connectors.push(new MetaMaskConnector({ chains }))

// Add injected connector for other wallets
connectors.push(new InjectedConnector({
  chains,
  options: {
    name: 'Injected',
    shimDisconnect: true,
  },
}))

// Add Coinbase Wallet connector
connectors.push(new CoinbaseWalletConnector({
  chains,
  options: {
    appName: 'CertifyWeb3',
  },
}))

// Only add WalletConnect if we have a valid project ID
if (hasValidWalletConnectId) {
  try {
    const { connectors: rainbowConnectors } = getDefaultWallets({
      appName: 'CertifyWeb3',
      projectId: walletConnectProjectId,
      chains
    })
    
    connectors.push(...rainbowConnectors())
    
    connectors.push(new WalletConnectConnector({
      chains,
      options: {
        projectId: walletConnectProjectId,
        showQrModal: true,
      },
    }))
  } catch (error) {
    console.warn('⚠️ WalletConnect configuration failed:', error)
  }
} else {
  console.warn('⚠️ WalletConnect disabled: No valid project ID provided')
}

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export { chains }