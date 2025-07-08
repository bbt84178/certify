import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { 
  Shield, 
  Zap, 
  Palette, 
  Network, 
  CheckCircle, 
  ArrowRight,
  Star,
  Users,
  Award,
  Globe
} from 'lucide-react'

const LandingPage: React.FC = () => {
  const { t } = useTranslation()

  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: t('landing.features.noCode.title'),
      description: t('landing.features.noCode.description'),
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: t('landing.features.blockchain.title'),
      description: t('landing.features.blockchain.description'),
      color: 'from-green-400 to-blue-500'
    },
    {
      icon: <Palette className="h-8 w-8" />,
      title: t('landing.features.customizable.title'),
      description: t('landing.features.customizable.description'),
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: <Network className="h-8 w-8" />,
      title: t('landing.features.multiChain.title'),
      description: t('landing.features.multiChain.description'),
      color: 'from-blue-400 to-indigo-500'
    }
  ]

  const stats = [
    { number: '10K+', label: 'Certificates Issued', icon: <Award className="h-6 w-6" /> },
    { number: '500+', label: 'Organizations', icon: <Users className="h-6 w-6" /> },
    { number: '50+', label: 'Countries', icon: <Globe className="h-6 w-6" /> },
    { number: '99.9%', label: 'Uptime', icon: <CheckCircle className="h-6 w-6" /> }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  {t('landing.hero.title')}
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
                {t('landing.hero.subtitle')}
              </p>
              
              <p className="text-lg text-gray-500 mb-12 max-w-4xl mx-auto">
                {t('landing.hero.description')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                to="/dashboard"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
              >
                <span>{t('landing.hero.getStarted')}</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <Link
                to="/verify"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
              >
                {t('landing.hero.learnMore')}
              </Link>
            </motion.div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-10 opacity-20">
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
            />
          </div>
          <div className="absolute top-40 right-20 opacity-20">
            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-blue-600">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              {t('landing.features.title')}
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
              Join thousands of organizations already using CertifyWeb3 to issue verified certificates.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <span>Start Creating Certificates</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage