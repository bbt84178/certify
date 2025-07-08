import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { 
  User, 
  BookOpen, 
  Calendar, 
  Wallet, 
  Send, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  ExternalLink,
  ArrowLeft
} from 'lucide-react'
import { useCertificates } from '../hooks/useCertificates'
import { useBlockchain } from '../hooks/useBlockchain'
import { useIPFS } from '../hooks/useIPFS'
import { useCompany } from '../hooks/useCompany'
import { generateCertificatePDF } from '../services/pdf'
import toast from 'react-hot-toast'

interface CertificateForm {
  recipientName: string
  courseName: string
  issueDate: string
  recipientAddress: string
  description?: string
  isPublic: boolean
  isSoulbound: boolean
}

const CertificateCreator: React.FC = () => {
  const { t } = useTranslation()
  const { createCertificate } = useCertificates()
  const { mintCertificate, isMinting } = useBlockchain()
  const { uploadCertificate, uploading } = useIPFS()
  const { company } = useCompany()
  
  const [step, setStep] = useState<'form' | 'preview' | 'minting' | 'success'>('form')
  const [certificateData, setCertificateData] = useState<CertificateForm | null>(null)
  const [mintedCertificate, setMintedCertificate] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<CertificateForm>({
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      isPublic: true,
      isSoulbound: true
    }
  })

  const formData = watch()

  const onSubmit = (data: CertificateForm) => {
    setCertificateData(data)
    setStep('preview')
  }

  const handleMintCertificate = async () => {
    if (!certificateData || !company) return

    setStep('minting')

    try {
      // Generate certificate ID
      const certificateId = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Generate PDF
      const pdfData = await generateCertificatePDF({
        recipientName: certificateData.recipientName,
        courseName: certificateData.courseName,
        issueDate: certificateData.issueDate,
        issuerName: company.name,
        description: certificateData.description
      }, certificateId)

      // Upload to IPFS
      const ipfsResult = await uploadCertificate(
        pdfData,
        certificateId,
        certificateData.recipientName
      )

      // Mint on blockchain
      const mintResult = await mintCertificate({
        recipientAddress: certificateData.recipientAddress,
        recipientName: certificateData.recipientName,
        courseName: certificateData.courseName,
        ipfsHash: ipfsResult.metadataCid,
        isPublic: certificateData.isPublic,
        isSoulbound: certificateData.isSoulbound
      })

      if (mintResult) {
        // Save to database
        const dbResult = await createCertificate({
          tokenId: mintResult.tokenId,
          certificateId,
          contractAddress: mintResult.contractAddress,
          recipientAddress: certificateData.recipientAddress,
          recipientName: certificateData.recipientName,
          courseName: certificateData.courseName,
          description: certificateData.description,
          issueDate: certificateData.issueDate,
          ipfsHash: ipfsResult.metadataCid,
          pdfHash: ipfsResult.pdfCid,
          transactionHash: mintResult.transactionHash,
          blockNumber: mintResult.blockNumber,
          blockchain: company.blockchain,
          isPublic: certificateData.isPublic,
          isSoulbound: certificateData.isSoulbound
        })

        setMintedCertificate({
          ...dbResult,
          certificateId,
          tokenId: mintResult.tokenId,
          transactionHash: mintResult.transactionHash,
          ipfsUrl: ipfsResult.metadataUrl,
          pdfUrl: ipfsResult.pdfUrl
        })

        setStep('success')
        toast.success('Certificat créé avec succès!')
      }
    } catch (error: any) {
      console.error('Certificate creation error:', error)
      toast.error(error.message || 'Erreur lors de la création du certificat')
      setStep('preview')
    }
  }

  const resetForm = () => {
    setStep('form')
    setCertificateData(null)
    setMintedCertificate(null)
    reset()
  }

  if (!company?.contractAddress) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="panel p-8 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Smart Contract Requis
            </h2>
            <p className="text-gray-600 mb-6">
              Vous devez d'abord déployer votre smart contract pour pouvoir créer des certificats.
            </p>
            <a
              href="/settings"
              className="btn-primary"
            >
              Configurer maintenant
            </a>
          </div>
        </div>
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
          <div className="flex items-center space-x-4 mb-4">
            {step !== 'form' && (
              <button
                onClick={() => setStep('form')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Créer un Certificat
              </h1>
              <p className="text-gray-600">
                Émettez un nouveau certificat vérifié sur la blockchain
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { key: 'form', label: 'Détails', icon: <User className="h-5 w-5" /> },
              { key: 'preview', label: 'Aperçu', icon: <BookOpen className="h-5 w-5" /> },
              { key: 'minting', label: 'Création', icon: <Loader2 className="h-5 w-5" /> },
              { key: 'success', label: 'Terminé', icon: <CheckCircle className="h-5 w-5" /> }
            ].map((stepItem, index) => (
              <div key={stepItem.key} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200 ${
                    step === stepItem.key
                      ? 'bg-blue-500 text-white'
                      : index < ['form', 'preview', 'minting', 'success'].indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {stepItem.icon}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    step === stepItem.key ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {stepItem.label}
                </span>
                {index < 3 && (
                  <div
                    className={`w-16 h-0.5 ml-4 ${
                      index < ['form', 'preview', 'minting', 'success'].indexOf(step)
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Step */}
        {step === 'form' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="panel p-8"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    Nom du destinataire *
                  </label>
                  <input
                    {...register('recipientName', { required: 'Le nom du destinataire est requis' })}
                    className="input"
                    placeholder="Nom complet du destinataire"
                  />
                  {errors.recipientName && (
                    <p className="text-red-500 text-sm mt-1">{errors.recipientName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="h-4 w-4 inline mr-2" />
                    Nom du cours/formation *
                  </label>
                  <input
                    {...register('courseName', { required: 'Le nom du cours est requis' })}
                    className="input"
                    placeholder="Nom du cours ou de la formation"
                  />
                  {errors.courseName && (
                    <p className="text-red-500 text-sm mt-1">{errors.courseName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Date d'émission *
                  </label>
                  <input
                    type="date"
                    {...register('issueDate', { required: 'La date d\'émission est requise' })}
                    className="input"
                  />
                  {errors.issueDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.issueDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Wallet className="h-4 w-4 inline mr-2" />
                    Adresse wallet du destinataire *
                  </label>
                  <input
                    {...register('recipientAddress', { 
                      required: 'L\'adresse wallet est requise',
                      pattern: {
                        value: /^0x[a-fA-F0-9]{40}$/,
                        message: 'Adresse Ethereum invalide'
                      }
                    })}
                    className="input"
                    placeholder="0x..."
                  />
                  {errors.recipientAddress && (
                    <p className="text-red-500 text-sm mt-1">{errors.recipientAddress.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optionnel)
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input"
                  placeholder="Détails supplémentaires sur le certificat..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('isPublic')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    Rendre ce certificat visible publiquement dans la galerie
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('isSoulbound')}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    Certificat Soulbound (non-transférable)
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>Continuer vers l'aperçu</span>
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Preview Step */}
        {step === 'preview' && certificateData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="panel p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Aperçu du Certificat</h3>
              
              {/* Certificate Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 mb-6">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold text-gray-900">Certificat de Réussite</h2>
                  <p className="text-lg text-gray-600">Ceci certifie que</p>
                  <h3 className="text-4xl font-bold text-blue-600">{certificateData.recipientName}</h3>
                  <p className="text-lg text-gray-600">a terminé avec succès</p>
                  <h4 className="text-2xl font-semibold text-gray-900">{certificateData.courseName}</h4>
                  <p className="text-gray-600">le {new Date(certificateData.issueDate).toLocaleDateString()}</p>
                  {certificateData.description && (
                    <p className="text-gray-600 mt-4 max-w-2xl mx-auto">{certificateData.description}</p>
                  )}
                  <div className="mt-6 text-sm text-gray-500">
                    Émis par {company?.name}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('form')}
                  className="btn-secondary"
                >
                  Retour à l'édition
                </button>
                <button
                  onClick={handleMintCertificate}
                  disabled={isMinting || uploading}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isMinting || uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Créer le Certificat</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Minting Step */}
        {step === 'minting' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="panel p-8 text-center"
          >
            <div className="mb-6">
              <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Création du Certificat</h3>
              <p className="text-gray-600">
                Veuillez patienter pendant que nous générons votre certificat et l'enregistrons sur la blockchain...
              </p>
            </div>
            
            <div className="space-y-3 text-left max-w-md mx-auto">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">Génération du PDF</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">Téléchargement vers IPFS</span>
              </div>
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                <span className="text-sm text-gray-600">Mint NFT sur la blockchain</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success Step */}
        {step === 'success' && mintedCertificate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="panel p-8 text-center"
          >
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Certificat Créé avec Succès!</h3>
              <p className="text-gray-600">
                Votre certificat a été créé et enregistré sur la blockchain.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-500">ID du Certificat</p>
                  <p className="font-mono text-sm text-gray-900">{mintedCertificate.certificateId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Token ID</p>
                  <p className="font-mono text-sm text-gray-900">{mintedCertificate.tokenId}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Hash de Transaction</p>
                  <p className="font-mono text-sm text-gray-900 break-all">{mintedCertificate.transactionHash}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={mintedCertificate.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger PDF</span>
              </a>
              <a
                href={`https://sepolia.etherscan.io/tx/${mintedCertificate.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Voir sur Blockchain</span>
              </a>
              <button
                onClick={resetForm}
                className="btn-primary"
              >
                Créer un Autre Certificat
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default CertificateCreator