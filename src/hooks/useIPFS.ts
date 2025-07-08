import { useState } from 'react'
import { ipfsAPI } from '../services/api'
import toast from 'react-hot-toast'

export const useIPFS = () => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)
      setError(null)
      const response = await ipfsAPI.uploadFile(file)
      toast.success('File uploaded to IPFS successfully!')
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to upload file'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const uploadJSON = async (metadata: any, filename?: string) => {
    try {
      setUploading(true)
      setError(null)
      const response = await ipfsAPI.uploadJSON(metadata, filename)
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to upload metadata'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const uploadCertificate = async (
    pdfData: string,
    certificateId: string,
    recipientName: string
  ) => {
    try {
      setUploading(true)
      setError(null)
      const response = await ipfsAPI.uploadCertificate(pdfData, certificateId, recipientName)
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to upload certificate'
      setError(errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setUploading(false)
    }
  }

  return {
    uploading,
    error,
    uploadFile,
    uploadJSON,
    uploadCertificate
  }
}