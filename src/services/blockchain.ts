import { ethers } from 'ethers'

import { contractAPI } from './api'

// Contract ABIs
export const FACTORY_ABI = [
  "function registerCompany(string memory _name, string memory _description, string memory _symbol) external",
  "function getCompany(address _owner) external view returns (tuple(address owner, address contractAddress, string name, string description, uint256 createdAt, bool isActive))",
  "function getCompanyContract(address _owner) external view returns (address)",
  "event CompanyRegistered(address indexed owner, address indexed contractAddress, string name)"
]

export const CERTIFICATE_ABI = [
  "function issueCertificate(address _recipient, string memory _recipientName, string memory _courseName, string memory _ipfsHash, bool _isPublic, bool _isSoulbound) external returns (uint256)",
  "function getCertificate(uint256 _tokenId) external view returns (tuple(uint256 tokenId, address recipient, string recipientName, string courseName, string ipfsHash, uint256 issueDate, bool isPublic, bool isSoulbound))",
  "function totalSupply() external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "event CertificateIssued(uint256 indexed tokenId, address indexed recipient, string recipientName, string courseName, string ipfsHash, bool isPublic, bool isSoulbound)"
]

// Factory contract addresses by network
export const FACTORY_ADDRESSES: Record<string, string> = {
  ethereum: import.meta.env.VITE_FACTORY_ADDRESS_ETHEREUM || '',
  sepolia: import.meta.env.VITE_FACTORY_ADDRESS_SEPOLIA || '',
  bsc: import.meta.env.VITE_FACTORY_ADDRESS_BSC || '',
  bscTestnet: import.meta.env.VITE_FACTORY_ADDRESS_BSC_TESTNET || '',
  polygon: import.meta.env.VITE_FACTORY_ADDRESS_POLYGON || '',
  polygonMumbai: import.meta.env.VITE_FACTORY_ADDRESS_POLYGON_MUMBAI || '',
}

// Network configurations
export const NETWORK_CONFIGS = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io'
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  bsc: {
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    blockExplorer: 'https://bscscan.com'
  },
  bscTestnet: {
    chainId: 97,
    name: 'BNB Smart Chain Testnet',
    symbol: 'BNB',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    blockExplorer: 'https://testnet.bscscan.com'
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com/',
    blockExplorer: 'https://polygonscan.com'
  },
  polygonMumbai: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
    blockExplorer: 'https://mumbai.polygonscan.com'
  }
}

// Types pour une meilleure sécurité des types
export interface CertificateData {
  recipientAddress: string
  recipientName: string
  courseName: string
  ipfsHash: string
  isPublic?: boolean
  isSoulbound?: boolean
}

export interface Certificate {
  tokenId: string
  recipient: string
  recipientName: string
  courseName: string
  ipfsHash: string
  issueDate: string
  isPublic: boolean
  isSoulbound: boolean
}

export interface CompanyInfo {
  owner: string
  contractAddress: string
  name: string
  description: string
  createdAt: string
  isActive: boolean
}

export class BlockchainService {
  private provider: ethers.BrowserProvider | ethers.providers.Web3Provider | null = null
  private signer: ethers.JsonRpcSigner | ethers.Signer | null = null

  constructor() {
    this.initializeProvider()
  }

  private async initializeProvider() {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      console.warn('No ethereum provider found in window')
      return
    }

    try {
      // Détection automatique de la version d'ethers
      if (ethers.BrowserProvider) {
        // ethers v6
        this.provider = new ethers.BrowserProvider((window as any).ethereum)
      } else if (ethers.providers?.Web3Provider) {
        // ethers v5
        this.provider = new ethers.providers.Web3Provider((window as any).ethereum)
      } else {
        throw new Error('Unsupported ethers version')
      }
    } catch (error) {
      console.error('Failed to initialize provider:', error)
      throw error
    }
  }

  async getSigner(): Promise<ethers.JsonRpcSigner | ethers.Signer> {
    if (!this.provider) {
      throw new Error('No provider available')
    }

    try {
      if (this.provider instanceof ethers.BrowserProvider) {
        // ethers v6
        return await this.provider.getSigner()
      } else {
        // ethers v5
        return (this.provider as ethers.providers.Web3Provider).getSigner()
      }
    } catch (error) {
      console.error('Failed to get signer:', error)
      throw error
    }
  }

  async connectWallet(): Promise<string[]> {
    if (!this.provider) {
      throw new Error('No wallet provider found')
    }

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      this.signer = await this.getSigner()
      return accounts
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }

  async getAccount(): Promise<string | null> {
    try {
      if (!this.signer) {
        await this.connectWallet()
      }
      
      const signer = await this.getSigner()
      return await signer.getAddress()
    } catch (error) {
      console.error('Failed to get account:', error)
      return null
    }
  }

  async getNetwork(): Promise<{ chainId: number; name: string } | null> {
    if (!this.provider) return null

    try {
      const network = await this.provider.getNetwork()
      return {
        chainId: Number(network.chainId),
        name: network.name
      }
    } catch (error) {
      console.error('Failed to get network:', error)
      return null
    }
  }

  async deployCompanyContract(
    companyName: string,
    description: string,
    symbol: string,
    blockchain: string
  ): Promise<any> {
    try {
      const response = await contractAPI.deploy(companyName, description, symbol, blockchain)
      return response.data
    } catch (error) {
      console.error('Contract deployment error:', error)
      throw error
    }
  }

  async issueCertificate(data: CertificateData): Promise<any> {
    try {
      const response = await contractAPI.issueCertificate(data)
      return response.data
    } catch (error) {
      console.error('Certificate issuance error:', error)
      throw error
    }
  }

  async getCertificateFromBlockchain(contractAddress: string, tokenId: string): Promise<Certificate> {
    try {
      const response = await contractAPI.getCertificate(contractAddress, tokenId)
      return response.data
    } catch (error) {
      console.error('Get certificate error:', error)
      throw error
    }
  }

  async getContractInfo(contractAddress: string): Promise<any> {
    try {
      const response = await contractAPI.getContractInfo(contractAddress)
      return response.data
    } catch (error) {
      console.error('Get contract info error:', error)
      throw error
    }
  }

  getBlockExplorerUrl(blockchain: string, hash: string, type: 'tx' | 'address' = 'tx'): string {
    const config = NETWORK_CONFIGS[blockchain as keyof typeof NETWORK_CONFIGS]
    if (!config) return ''
    
    const path = type === 'tx' ? 'tx' : 'address'
    return `${config.blockExplorer}/${path}/${hash}`
  }

  async switchNetwork(blockchain: string): Promise<void> {
    if (!this.provider || !(window as any).ethereum) {
      throw new Error('No wallet connected')
    }

    const config = NETWORK_CONFIGS[blockchain as keyof typeof NETWORK_CONFIGS]
    if (!config) {
      throw new Error('Unsupported network')
    }

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${config.chainId.toString(16)}` }],
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${config.chainId.toString(16)}`,
                chainName: config.name,
                nativeCurrency: {
                  name: config.symbol,
                  symbol: config.symbol,
                  decimals: 18,
                },
                rpcUrls: [config.rpcUrl],
                blockExplorerUrls: [config.blockExplorer],
              },
            ],
          })
        } catch (addError) {
          throw new Error('Failed to add network to wallet')
        }
      } else {
        throw new Error('Failed to switch network')
      }
    }
  }

  async getBalance(address?: string): Promise<string> {
    if (!this.provider) {
      throw new Error('No provider available')
    }

    try {
      const targetAddress = address || await this.getAccount()
      if (!targetAddress) {
        throw new Error('No address provided')
      }

      const balance = await this.provider.getBalance(targetAddress)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Failed to get balance:', error)
      throw error
    }
  }

  async estimateGas(to: string, data: string): Promise<string> {
    if (!this.provider) {
      throw new Error('No provider available')
    }

    try {
      const gasEstimate = await this.provider.estimateGas({ to, data })
      return ethers.formatUnits(gasEstimate, 'gwei')
    } catch (error) {
      console.error('Failed to estimate gas:', error)
      throw error
    }
  }

  // Méthodes pour l'écoute des événements
  async listenForCertificateEvents(contractAddress: string, callback: (event: any) => void): Promise<void> {
    if (!this.provider) {
      throw new Error('No provider available')
    }

    try {
      const contract = new ethers.Contract(contractAddress, CERTIFICATE_ABI, this.provider)
      
      contract.on('CertificateIssued', (tokenId, recipient, recipientName, courseName, ipfsHash, isPublic, isSoulbound, event) => {
        callback({
          tokenId: tokenId.toString(),
          recipient,
          recipientName,
          courseName,
          ipfsHash,
          isPublic,
          isSoulbound,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        })
      })
    } catch (error) {
      console.error('Failed to listen for events:', error)
      throw error
    }
  }

  async removeEventListeners(contractAddress: string): Promise<void> {
    if (!this.provider) return

    try {
      const contract = new ethers.Contract(contractAddress, CERTIFICATE_ABI, this.provider)
      contract.removeAllListeners('CertificateIssued')
    } catch (error) {
      console.error('Failed to remove event listeners:', error)
    }
  }

  // Méthode pour vérifier si le wallet est connecté
  async isConnected(): Promise<boolean> {
    try {
      const account = await this.getAccount()
      return !!account
    } catch (error) {
      return false
    }
  }

  // Méthode pour se déconnecter (nettoyage)
  disconnect(): void {
    this.provider = null
    this.signer = null
  }
}

export const blockchainService = new BlockchainService()