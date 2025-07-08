import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { 
  Building, 
  Save, 
  Upload, 
  Trash2,
  Shield,
  ExternalLink,
  Copy,
  CheckCircle,
  Loader2,
  Globe,
  Mail,
  MapPin
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useCompany } from '../hooks/useCompany'
import { useBlockchain } from '../hooks/useBlockchain'
import { useIPFS } from '../hooks/useIPFS'
import { useAccount, useNetwork } from 'wagmi'
import toast from 'react-hot-toast'

interface CompanyForm {
  name: string
  description: string
  website: string
  email: string
  industry: string
  country: string
  blockchain: string
  symbol: string
}

const CompanySettings: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { address } = useAccount()
  const { chain } = useNetwork()
  const { company, loading, saveCompany, setContractAddress } = useCompany()
  const { deployContract, isDeploying } = useBlockchain()
  const { uploadFile, uploading } = useIPFS()
  
  const [logo, setLogo] = useState<string>('')
  const [activeTab, setActiveTab] = useState('profile')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<CompanyForm>({
    defaultValues: {
      blockchain: 'sepolia',
      symbol: 'CERT'
    }
  })

  const watchedBlockchain = watch('blockchain')

  useEffect(() => {
    if (company) {
      setValue('name', company.name || '')
      setValue('description', company.description || '')
      setValue('website', company.website || '')
      setValue('email', company.email || '')
      setValue('industry', company.industry || '')
      setValue('country', company.country || '')
      setValue('blockchain', company.blockchain || 'sepolia')
      setLogo(company.logo || '')
    }
  }, [company, setValue])

  const industries = [
    'Technology',
    'Education',
    'Healthcare',
    'Finance',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Non-profit',
    'Government',
    'Other'
  ]

  const blockchains = [
    { id: 'ethereum', name: 'Ethereum Mainnet', symbol: 'ETH', testnet: false },
    { id: 'sepolia', name: 'Sepolia Testnet', symbol: 'ETH', testnet: true },
    { id: 'bsc', name: 'BNB Smart Chain', symbol: 'BNB', testnet: false },
    { id: 'bscTestnet', name: 'BNB Testnet', symbol: 'BNB', testnet: true },
    { id: 'polygon', name: 'Polygon Mainnet', symbol: 'MATIC', testnet: false },
    { id: 'polygonMumbai', name: 'Polygon Mumbai', symbol: 'MATIC', testnet: true }
  ]

  const onSubmit = async (data: CompanyForm) => {
    try {
      await saveCompany({
        name: data.name,
        description: data.description,
        website: data.website,
        email: data.email,
        industry: data.industry,
        country: data.country,
        blockchain: data.blockchain,
        logo
      })
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const result = await uploadFile(file)
        setLogo(result.url)
        toast.success('Logo téléchargé avec succès!')
      } catch (error) {
        toast.error('Erreur lors du téléchargement du logo')
      }
    }
  }

  const handleDeployContract = async () => {
    const formData = watch()
    
    if (!formData.name || !formData.symbol) {
      toast.error('Veuillez remplir le nom de l\'entreprise et le symbole')
      return
    }

    try {
      const result = await deployContract(
        formData.name,
        formData.description || '',
        formData.symbol,
        formData.blockchain
      )

      if (result) {
        await setContractAddress(result.contractAddress, result.transactionHash)
      }
    } catch (error) {
      console.error('Deploy error:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copié dans le presse-papiers!')
  }

  const getBlockExplorerUrl = (hash: string) => {
    const explorers: Record<string, string> = {
      ethereum: 'https://etherscan.io',
      sepolia: 'https://sepolia.etherscan.io',
      bsc: 'https://bscscan.com',
      bscTestnet: 'https://testnet.bscscan.com',
      polygon: 'https://polygonscan.com',
      polygonMumbai: 'https://mumbai.polygonscan.com'
    }
    
    const explorer = explorers[company?.blockchain || 'sepolia']
    return `${explorer}/address/${hash}`
  }

  const tabs = [
    { id: 'profile', label: 'Profil Entreprise', icon: <Building className="h-5 w-5" /> },
    { id: 'blockchain', label: 'Blockchain', icon: <Shield className="h-5 w-5" /> }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paramètres Entreprise
          </h1>
          <p className="text-gray-600">
            Configurez votre profil d'organisation et votre blockchain
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="panel p-8"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Logo de l'entreprise
                </label>
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {logo ? (
                      <img src={logo} alt="Company logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="logo-upload"
                      className="btn-secondary cursor-pointer inline-flex items-center space-x-2"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>{uploading ? 'Téléchargement...' : 'Télécharger Logo'}</span>
                    </label>
                    {logo && (
                      <button
                        type="button"
                        onClick={() => setLogo('')}
                        className="ml-3 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <input
                    {...register('name', { required: 'Le nom de l\'entreprise est requis' })}
                    className="input"
                    placeholder="Entrez le nom de votre entreprise"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secteur d'activité
                  </label>
                  <select {...register('industry')} className="input">
                    <option value="">Sélectionnez un secteur</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site web
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('website')}
                      type="url"
                      className="input pl-10"
                      placeholder="https://votre-entreprise.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de contact
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('email')}
                      type="email"
                      className="input pl-10"
                      placeholder="contact@votre-entreprise.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('country')}
                      className="input pl-10"
                      placeholder="Entrez votre pays"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="input"
                  placeholder="Décrivez votre organisation et ce que vous faites..."
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-primary flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Sauvegarder</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Blockchain Tab */}
        {activeTab === 'blockchain' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Contract Status */}
            <div className="panel p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Smart Contract</h3>
                  <p className="text-gray-600">Votre contrat de certification dédié</p>
                </div>
                <div className="flex items-center space-x-2">
                  {company?.contractAddress ? (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>Déployé</span>
                    </div>
                  ) : (
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      Non Déployé
                    </div>
                  )}
                </div>
              </div>

              {company?.contractAddress ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Adresse du Contrat</p>
                      <p className="font-mono text-sm text-gray-900">{company.contractAddress}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(company.contractAddress!)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={getBlockExplorerUrl(company.contractAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-6">
                    Déployez votre smart contract pour commencer à émettre des certificats
                  </p>
                  
                  {/* Deployment form */}
                  <div className="max-w-md mx-auto space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blockchain
                      </label>
                      <select
                        {...register('blockchain')}
                        className="input"
                      >
                        {blockchains.map(blockchain => (
                          <option key={blockchain.id} value={blockchain.id}>
                            {blockchain.name} {blockchain.testnet && '(Testnet)'}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Symbole du Token
                      </label>
                      <input
                        {...register('symbol', { required: 'Le symbole est requis' })}
                        className="input"
                        placeholder="CERT"
                        maxLength={10}
                      />
                      {errors.symbol && (
                        <p className="text-red-500 text-sm mt-1">{errors.symbol.message}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={handleDeployContract}
                      disabled={isDeploying || !watch('name')}
                      className="btn-primary flex items-center space-x-2 mx-auto"
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Déploiement...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4" />
                          <span>Déployer le Contrat</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Network Info */}
            <div className="panel p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Réseau Blockchain
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {blockchains.filter(b => b.testnet).map((blockchain) => (
                  <div
                    key={blockchain.id}
                    className={`p-4 rounded-lg transition-all duration-200 cursor-pointer ${
                      watchedBlockchain === blockchain.id
                        ? 'bg-blue-50 ring-2 ring-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setValue('blockchain', blockchain.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        blockchain.id.includes('ethereum') || blockchain.id.includes('sepolia') ? 'bg-blue-500' :
                        blockchain.id.includes('bsc') ? 'bg-yellow-500' :
                        'bg-purple-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{blockchain.name}</p>
                        <p className="text-sm text-gray-600">{blockchain.symbol}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default CompanySettings