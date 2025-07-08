import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { 
  Award, 
  Users, 
  Download, 
  TrendingUp, 
  Plus, 
  Edit, 
  BarChart3,
  Calendar,
  Eye,
  ExternalLink,
  Building,
  Wallet,
  Shield
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useCompany } from '../hooks/useCompany'
import { useCertificates } from '../hooks/useCertificates'
import { useAccount } from 'wagmi'

const Dashboard: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { address } = useAccount()
  const { company, loading: companyLoading } = useCompany()
  const { certificates, loading: certificatesLoading, fetchCertificates } = useCertificates()

  useEffect(() => {
    if (user && address) {
      fetchCertificates()
    }
  }, [user, address])
  useEffect(() => {
    console.log('Dashboard mounted')
    console.log('User:', user)
    console.log('Address:', address)
    console.log('Company:', company)
  }, [])

  useEffect(() => {
    const debugAuth = async () => {
      console.log('=== DEBUG AUTHENTICATION ===')
      
      // 1. Vérifier le token
      const token = localStorage.getItem('auth_token')
      console.log('Token exists:', !!token)
      console.log('Token preview:', token?.substring(0, 30) + '...')
      
      // 2. Décoder le token pour voir son contenu (côté client)
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          console.log('Token payload:', payload)
          console.log('Token expires:', new Date(payload.exp * 1000))
          console.log('Token expired:', payload.exp * 1000 < Date.now())
        } catch (e) {
          console.error('Token decode error:', e)
        }
      }
      
      // 3. Tester l'endpoint /auth/me
      if (token) {
        try {
          const response = await fetch('http://localhost:3001/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          console.log('Auth/me response:', response.status)
          if (response.ok) {
            const data = await response.json()
            console.log('Auth/me data:', data)
          } else {
            console.log('Auth/me error:', await response.text())
          }
        } catch (err) {
          console.error('Auth/me fetch error:', err)
        }
      }
    }
    
    debugAuth()
  }, [])
  const stats = [
    {
      title: 'Total Certificats',
      value: certificates.length.toString(),
      icon: <Award className="h-6 w-6" />,
      color: 'from-blue-500 to-blue-600',
      change: '+12%'
    },
    {
      title: 'Certificats Actifs',
      value: certificates.filter(c => c.isPublic).length.toString(),
      icon: <Users className="h-6 w-6" />,
      color: 'from-green-500 to-green-600',
      change: '+8%'
    },
    {
      title: 'Total Téléchargements',
      value: company?.stats?.totalDownloads?.toString() || '0',
      icon: <Download className="h-6 w-6" />,
      color: 'from-purple-500 to-purple-600',
      change: '+23%'
    },
    {
      title: 'Émis ce mois',
      value: company?.stats?.monthlyIssued?.toString() || '0',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'from-orange-500 to-orange-600',
      change: '+15%'
    }
  ]

  const quickActions = [
    {
      title: 'Créer un Certificat',
      description: 'Émettre un nouveau certificat à un destinataire',
      icon: <Plus className="h-6 w-6" />,
      link: '/create',
      color: 'from-blue-500 to-blue-600',
      enabled: !!company?.contractAddress
    },
    {
      title: 'Éditeur de Template',
      description: 'Personnaliser votre modèle de certificat',
      icon: <Edit className="h-6 w-6" />,
      link: '/editor',
      color: 'from-purple-500 to-purple-600',
      enabled: true
    },
    {
      title: 'Paramètres Entreprise',
      description: 'Configurer votre profil et blockchain',
      icon: <Building className="h-6 w-6" />,
      link: '/settings',
      color: 'from-green-500 to-green-600',
      enabled: true
    }
  ]

  const recentCertificates = certificates.slice(0, 5)

  if (companyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tableau de bord
              </h1>
              <p className="text-gray-600">
                {company?.name ? `Bienvenue ${company.name}` : 'Configurez votre entreprise pour commencer'}
              </p>
            </div>
            
            {/* Company status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
              
              {company?.contractAddress && (
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Smart Contract Déployé
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Setup warning */}
        {!company && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center space-x-3">
              <Building className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900">
                  Configuration requise
                </h3>
                <p className="text-yellow-700 mb-4">
                  Vous devez d'abord configurer votre entreprise et déployer votre smart contract.
                </p>
                <Link
                  to="/settings"
                  className="btn-primary"
                >
                  Configurer maintenant
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="panel p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} text-white`}>
                  {stat.icon}
                </div>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </h3>
              <p className="text-gray-600 text-sm">
                {stat.title}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="panel p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Actions Rapides
              </h2>
              <div className="space-y-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className={`block p-4 rounded-lg transition-all duration-200 group ${
                      action.enabled 
                        ? 'hover:shadow-md' 
                        : 'opacity-50 cursor-not-allowed pointer-events-none'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Certificates */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="panel p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Certificats Récents
                </h2>
                <Link
                  to="/certificates"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                >
                  <span>Voir tout</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              {certificatesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-4 p-4 rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentCertificates.length > 0 ? (
                <div className="space-y-4">
                  {recentCertificates.map((certificate, index) => (
                    <motion.div
                      key={certificate.certificateId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Award className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {certificate.recipientName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {certificate.courseName}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500 flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(certificate.issueDate).toLocaleDateString()}</span>
                            </span>
                            {certificate.isPublic && (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                Public
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun certificat
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Commencez par créer votre premier certificat
                  </p>
                  {company?.contractAddress && (
                    <Link
                      to="/create"
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Créer un Certificat</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard