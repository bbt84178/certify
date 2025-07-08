import { useState, useEffect } from 'react'
import { companyAPI } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

export const useCompany = () => {
  const { user } = useAuthStore()
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchCompany()
    }
  }, [user])

  const fetchCompany = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await companyAPI.getProfile()
      setCompany(response.data)
    } catch (error: any) {
      if (error.response?.status !== 404) {
        setError(error.response?.data?.error || 'Failed to fetch company')
      }
    } finally {
      setLoading(false)
    }
  }

  const saveCompany = async (data: any) => {
    try {
      setLoading(true)
      setError(null)
      const response = await companyAPI.saveProfile(data)
      setCompany(response.data)
      toast.success('Company profile saved successfully!')
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to save company'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (settings: any) => {
    try {
      setLoading(true)
      setError(null)
      const response = await companyAPI.updateSettings(settings)
      setCompany(response.data)
      toast.success('Settings updated successfully!')
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update settings'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const setContractAddress = async (contractAddress: string, transactionHash: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await companyAPI.setContract(contractAddress, transactionHash)
      await fetchCompany() // Refresh company data
      toast.success('Contract address updated successfully!')
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to set contract address'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    company,
    loading,
    error,
    fetchCompany,
    saveCompany,
    updateSettings,
    setContractAddress
  }
}