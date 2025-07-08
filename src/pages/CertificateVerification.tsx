import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  Search, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Download,
  Calendar,
  User,
  BookOpen,
  Building,
  QrCode
} from 'lucide-react'
import QRCode from 'qrcode'

const CertificateVerification: React.FC = () => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'id' | 'wallet'>('id')
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  // Mock certificate data
  const mockCertificate = {
    id: 'cert_1234567890',
    recipientName: 'John Doe',
    courseName: 'Blockchain Development Fundamentals',
    issueDate: '2024-01-15',
    issuerName: 'TechEdu Academy',
    recipientAddress: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e1e1',
    ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    blockNumber: 18500000,
    isVerified: true,
    description: 'This certificate validates the completion of a comprehensive blockchain development course covering smart contracts, DeFi protocols, and Web3 integration.'
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      // Mock verification logic
      if (searchQuery.includes('cert_') || searchQuery.startsWith('0x')) {
        setVerificationResult(mockCertificate)
        generateQRCode()
      } else {
        setVerificationResult(null)
      }
      setIsLoading(false)
    }, 1500)
  }

  const generateQRCode = async () => {
    try {
      const url = `${window.location.origin}/verify?id=${mockCertificate.id}`
      const qrUrl = await QRCode.toDataURL(url)
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Verify Certificate
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Enter a certificate ID or wallet address to verify the authenticity of a blockchain certificate
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8"
        >
          <div className="space-y-6">
            {/* Search Type Selector */}
            <div className="flex justify-center">
              <div className="bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setSearchType('id')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    searchType === 'id'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Certificate ID
                </button>
                <button
                  onClick={() => setSearchType('wallet')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    searchType === 'wallet'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Wallet Address
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  searchType === 'id' 
                    ? 'Enter certificate ID (e.g., cert_1234567890)' 
                    : 'Enter wallet address (e.g., 0x742d35...)'
                }
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            </div>

            {/* Search Button */}
            <div className="text-center">
              <button
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
                className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    <span>Verify Certificate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Verification Result */}
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Status Header */}
            <div className={`p-6 ${verificationResult.isVerified ? 'bg-green-50 border-b border-green-200' : 'bg-red-50 border-b border-red-200'}`}>
              <div className="flex items-center space-x-3">
                {verificationResult.isVerified ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <h3 className={`text-xl font-semibold ${verificationResult.isVerified ? 'text-green-900' : 'text-red-900'}`}>
                    {verificationResult.isVerified ? 'Certificate Verified' : 'Certificate Not Found'}
                  </h3>
                  <p className={`${verificationResult.isVerified ? 'text-green-700' : 'text-red-700'}`}>
                    {verificationResult.isVerified 
                      ? 'This certificate is authentic and verified on the blockchain'
                      : 'No certificate found with the provided identifier'
                    }
                  </p>
                </div>
              </div>
            </div>

            {verificationResult.isVerified && (
              <div className="p-8">
                {/* Certificate Details */}
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Certificate Info */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                      <h4 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                        Certificate of Completion
                      </h4>
                      <div className="text-center space-y-2">
                        <p className="text-gray-600">This is to certify that</p>
                        <h5 className="text-3xl font-bold text-blue-600">{verificationResult.recipientName}</h5>
                        <p className="text-gray-600">has successfully completed</p>
                        <h6 className="text-xl font-semibold text-gray-900">{verificationResult.courseName}</h6>
                        <p className="text-gray-600">
                          on {new Date(verificationResult.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <User className="h-5 w-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Recipient</p>
                            <p className="text-gray-900">{verificationResult.recipientName}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <BookOpen className="h-5 w-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Course</p>
                            <p className="text-gray-900">{verificationResult.courseName}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <Building className="h-5 w-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Issued by</p>
                            <p className="text-gray-900">{verificationResult.issuerName}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Issue Date</p>
                            <p className="text-gray-900">
                              {new Date(verificationResult.issueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <Shield className="h-5 w-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Certificate ID</p>
                            <p className="text-gray-900 font-mono text-sm">{verificationResult.id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <ExternalLink className="h-5 w-5 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Block Number</p>
                            <p className="text-gray-900">#{verificationResult.blockNumber.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {verificationResult.description && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h6 className="font-medium text-gray-900 mb-2">Description</h6>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {verificationResult.description}
                        </p>
                      </div>
                    )}

                    {/* Blockchain Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h6 className="font-medium text-gray-900 mb-3">Blockchain Details</h6>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Transaction Hash:</span>
                          <span className="font-mono text-gray-900 break-all">
                            {verificationResult.transactionHash}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">IPFS Hash:</span>
                          <span className="font-mono text-gray-900">
                            {verificationResult.ipfsHash}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Recipient Address:</span>
                          <span className="font-mono text-gray-900">
                            {verificationResult.recipientAddress}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Code and Actions */}
                  <div className="space-y-6">
                    {qrCodeUrl && (
                      <div className="text-center">
                        <h6 className="font-medium text-gray-900 mb-3 flex items-center justify-center space-x-2">
                          <QrCode className="h-5 w-5" />
                          <span>Share Certificate</span>
                        </h6>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                          <img src={qrCodeUrl} alt="Certificate QR Code" className="w-32 h-32" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Scan to verify this certificate
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <button className="w-full btn-primary flex items-center justify-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </button>
                      
                      <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                        <ExternalLink className="h-4 w-4" />
                        <span>View on Blockchain</span>
                      </button>
                      
                      <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                        <ExternalLink className="h-4 w-4" />
                        <span>View on IPFS</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Search Result - Not Found */}
        {verificationResult === null && searchQuery && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center"
          >
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Certificate Not Found</h3>
            <p className="text-gray-600 mb-6">
              No certificate was found with the provided {searchType === 'id' ? 'ID' : 'wallet address'}. 
              Please check your input and try again.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setVerificationResult(null)
              }}
              className="btn-secondary"
            >
              Try Another Search
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default CertificateVerification