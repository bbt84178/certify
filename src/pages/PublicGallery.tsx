import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  Search, 
  Filter, 
  Award, 
  Calendar, 
  User, 
  Building, 
  ExternalLink,
  Eye,
  Download,
  Grid,
  List
} from 'lucide-react'

interface PublicCertificate {
  id: string
  recipientName: string
  courseName: string
  issueDate: string
  issuerName: string
  category: string
  thumbnail: string
  isVerified: boolean
}

const PublicGallery: React.FC = () => {
  const { t } = useTranslation()
  const [certificates, setCertificates] = useState<PublicCertificate[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<PublicCertificate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)

  // Mock data
  const mockCertificates: PublicCertificate[] = [
    {
      id: 'cert_001',
      recipientName: 'Alice Johnson',
      courseName: 'Advanced React Development',
      issueDate: '2024-01-15',
      issuerName: 'TechEdu Academy',
      category: 'Technology',
      thumbnail: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400',
      isVerified: true
    },
    {
      id: 'cert_002',
      recipientName: 'Bob Smith',
      courseName: 'Digital Marketing Mastery',
      issueDate: '2024-01-10',
      issuerName: 'Marketing Pro Institute',
      category: 'Marketing',
      thumbnail: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=400',
      isVerified: true
    },
    {
      id: 'cert_003',
      recipientName: 'Carol Davis',
      courseName: 'Blockchain Fundamentals',
      issueDate: '2024-01-08',
      issuerName: 'Crypto University',
      category: 'Technology',
      thumbnail: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400',
      isVerified: true
    },
    {
      id: 'cert_004',
      recipientName: 'David Wilson',
      courseName: 'Project Management Professional',
      issueDate: '2024-01-05',
      issuerName: 'Business Excellence Center',
      category: 'Business',
      thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
      isVerified: true
    },
    {
      id: 'cert_005',
      recipientName: 'Eva Martinez',
      courseName: 'UX/UI Design Principles',
      issueDate: '2024-01-03',
      issuerName: 'Design Academy',
      category: 'Design',
      thumbnail: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
      isVerified: true
    },
    {
      id: 'cert_006',
      recipientName: 'Frank Thompson',
      courseName: 'Data Science with Python',
      issueDate: '2024-01-01',
      issuerName: 'Data Institute',
      category: 'Technology',
      thumbnail: 'https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg?auto=compress&cs=tinysrgb&w=400',
      isVerified: true
    }
  ]

  const categories = ['all', 'Technology', 'Marketing', 'Business', 'Design']

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setCertificates(mockCertificates)
      setFilteredCertificates(mockCertificates)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let filtered = certificates

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(cert =>
        cert.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.issuerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(cert => cert.category === selectedCategory)
    }

    setFilteredCertificates(filtered)
  }, [searchQuery, selectedCategory, certificates])
  console.log(localStorage.getItem('token'));
  const CertificateCard: React.FC<{ certificate: PublicCertificate; index: number }> = ({ certificate, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
    >
      <div className="relative">
        <img
          src={certificate.thumbnail}
          alt={certificate.courseName}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4">
          {certificate.isVerified && (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <Award className="h-3 w-3" />
              <span>Verified</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
            {certificate.courseName}
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{certificate.recipientName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>{certificate.issuerName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(certificate.issueDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            {certificate.category}
          </span>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200">
              <Eye className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200">
              <Download className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-200">
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )

  const CertificateListItem: React.FC<{ certificate: PublicCertificate; index: number }> = ({ certificate, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center space-x-6">
        <img
          src={certificate.thumbnail}
          alt={certificate.courseName}
          className="w-20 h-20 object-cover rounded-lg"
        />
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {certificate.courseName}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{certificate.recipientName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Building className="h-4 w-4" />
                  <span>{certificate.issuerName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(certificate.issueDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {certificate.category}
                </span>
                {certificate.isVerified && (
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <Award className="h-3 w-3" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200">
                <Eye className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200">
                <Download className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-200">
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Public Certificate Gallery
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore verified certificates from organizations worldwide
          </p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search certificates..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-4">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-gray-600">
            Showing {filteredCertificates.length} of {certificates.length} certificates
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certificates Grid/List */}
        {!isLoading && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCertificates.map((certificate, index) => (
                  <CertificateCard
                    key={certificate.id}
                    certificate={certificate}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCertificates.map((certificate, index) => (
                  <CertificateListItem
                    key={certificate.id}
                    certificate={certificate}
                    index={index}
                  />
                ))}
              </div>
            )}

            {/* No Results */}
            {filteredCertificates.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No certificates found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or browse all categories
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                  }}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PublicGallery