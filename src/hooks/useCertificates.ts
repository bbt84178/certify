import { useState, useEffect } from 'react'
import { certificateAPI } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

export const useCertificates = () => {
  const { user } = useAuthStore()
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  })

  const fetchCertificates = async (params: any = {}) => {
    try {
      setLoading(true)
      setError(null)
      const response = await certificateAPI.getCompanyCertificates(params)
      setCertificates(response.data.certificates)
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      })
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch certificates'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createCertificate = async (data: any) => {
    try {
      setLoading(true)
      setError(null)
      const response = await certificateAPI.create(data)
      await fetchCertificates() // Refresh list
      toast.success('Certificate created successfully!')
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create certificate'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getCertificateById = async (certificateId: string) => {
    try {
      const response = await certificateAPI.getById(certificateId)
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Certificate not found'
      toast.error(errorMessage)
      throw error
    }
  }

  const toggleVisibility = async (certificateId: string) => {
    try {
      const response = await certificateAPI.toggleVisibility(certificateId)
      await fetchCertificates() // Refresh list
      toast.success('Certificate visibility updated!')
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update visibility'
      toast.error(errorMessage)
      throw error
    }
  }

  const incrementDownload = async (certificateId: string) => {
    try {
      await certificateAPI.incrementDownload(certificateId)
    } catch (error) {
      // Silent fail for download tracking
      console.error('Failed to track download:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchCertificates()
    }
  }, [user])

  return {
    certificates,
    loading,
    error,
    pagination,
    fetchCertificates,
    createCertificate,
    getCertificateById,
    toggleVisibility,
    incrementDownload
  }
}