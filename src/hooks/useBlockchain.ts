import { useState } from 'react'
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi'
import { contractAPI } from '../services/api'
import { blockchainService } from '../services/blockchain'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

export const useBlockchain = () => {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const { switchNetwork } = useSwitchNetwork()
  const { user } = useAuthStore()
  const [isDeploying, setIsDeploying] = useState(false)
  const [isMinting, setIsMinting] = useState(false)

  const deployContract = async (
    companyName: string,
    description: string,
    symbol: string,
    blockchain: string
  ) => {
    if (!address) {
      toast.error('Veuillez connecter votre wallet')
      return null
    }

    try {
      setIsDeploying(true)
      
      // Switch to correct network if needed
      const targetChainId = getChainId(blockchain)
      if (chain?.id !== targetChainId) {
        await switchNetwork?.(targetChainId)
      }

      const result = await blockchainService.deployCompanyContract(
        companyName,
        description,
        symbol,
        blockchain
      )

      toast.success('Smart contract déployé avec succès!')
      return result
    } catch (error: any) {
      console.error('Deployment error:', error)
      toast.error(error.message || 'Erreur lors du déploiement')
      return null
    } finally {
      setIsDeploying(false)
    }
  }

  const mintCertificate = async (certificateData: {
    recipientAddress: string
    recipientName: string
    courseName: string
    ipfsHash: string
    isPublic?: boolean
    isSoulbound?: boolean
  }) => {
    if (!address) {
      toast.error('Veuillez connecter votre wallet')
      return null
    }

    try {
      setIsMinting(true)
      
      const result = await blockchainService.issueCertificate(certificateData)
      
      toast.success('Certificat minté avec succès!')
      return result
    } catch (error: any) {
      console.error('Minting error:', error)
      toast.error(error.message || 'Erreur lors du mint')
      return null
    } finally {
      setIsMinting(false)
    }
  }

  const getChainId = (blockchain: string): number => {
    const chainIds: Record<string, number> = {
      ethereum: 1,
      sepolia: 11155111,
      bsc: 56,
      bscTestnet: 97,
      polygon: 137,
      polygonMumbai: 80001
    }
    return chainIds[blockchain] || 1
  }

  return {
    deployContract,
    mintCertificate,
    isDeploying,
    isMinting,
    currentChain: chain,
    switchNetwork
  }
}