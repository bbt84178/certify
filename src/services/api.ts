import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors and log responses
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status, response.data)
    return response
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.response?.data)
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      // Don't redirect automatically, let components handle it
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  getNonce: (walletAddress: string) =>
    api.get(`/auth/nonce/${walletAddress}`),
  
  verify: (walletAddress: string, signature: string, message: string) =>
    api.post('/auth/verify', { walletAddress, signature, message }),
  
  getProfile: () => api.get('/auth/profile'),
  
  refreshToken: () => api.post('/auth/refresh'),
  
  logout: () => api.post('/auth/logout'),
}

// Company API
export const companyAPI = {
  getProfile: () => api.get('/company/profile'),
  
  saveProfile: (data: any) => api.post('/company/profile', data),
  
  updateSettings: (settings: any) => api.put('/company/settings', { settings }),
  
  getStats: () => api.get('/company/stats'),
  
  setContract: (contractAddress: string, transactionHash: string) =>
    api.post('/company/contract', { contractAddress, transactionHash }),
}

// Certificate API
export const certificateAPI = {
  create: (data: any) => api.post('/certificates', data),
  
  getCompanyCertificates: (params: any = {}) =>
    api.get('/certificates/company', { params }),
  
  getById: (certificateId: string) =>
    api.get(`/certificates/${certificateId}`),
  
  getByRecipient: (address: string) =>
    api.get(`/certificates/recipient/${address}`),
  
  getPublicGallery: (params: any = {}) =>
    api.get('/certificates/public/gallery', { params }),
  
  toggleVisibility: (certificateId: string) =>
    api.put(`/certificates/${certificateId}/visibility`),
  
  incrementDownload: (certificateId: string) =>
    api.post(`/certificates/${certificateId}/download`),
}

// IPFS API
export const ipfsAPI = {
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/ipfs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  uploadJSON: (metadata: any, filename?: string) =>
    api.post('/ipfs/upload-json', { metadata, filename }),
  
  uploadCertificate: (pdfData: string, certificateId: string, recipientName: string) =>
    api.post('/ipfs/upload-certificate', { pdfData, certificateId, recipientName }),
}

// Contract API
export const contractAPI = {
  deploy: (companyName: string, description: string, symbol: string, blockchain: string) =>
    api.post('/contracts/deploy', { companyName, description, symbol, blockchain }),
  
  issueCertificate: (data: any) =>
    api.post('/contracts/issue-certificate', data),
  
  getCertificate: (contractAddress: string, tokenId: string) =>
    api.get(`/contracts/certificate/${contractAddress}/${tokenId}`),
  
  getContractInfo: (contractAddress: string) =>
    api.get(`/contracts/info/${contractAddress}`),
}

// Health check
export const healthAPI = {
  check: () => api.get('/health')
}

export default api