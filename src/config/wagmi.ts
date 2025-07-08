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

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, sepolia, bsc, bscTestnet, polygon, polygonMumbai],
  [
    infuraProvider({ apiKey: import.meta.env.VITE_INFURA_PROJECT_ID || 'demo' }),
    alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY || 'demo' }),
    publicProvider()
  ]
)

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo'

const { connectors } = getDefaultWallets({
  appName: 'CertifyWeb3',
  projectId,
  chains
})

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    ...connectors(),
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId,
        showQrModal: true,
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'CertifyWeb3',
      },
    }),
    new InjectedConnector({
      chains,
      options: {
        name: 'Injected',
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
})

export { chains }