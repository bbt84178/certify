import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

console.log('🌐 API Base URL:', API_BASE_URL)

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add retry configuration
  validateStatus: function (status) {
    return status < 500; // Resolve only if the status code is less than 500
  }
})

// Add request retry logic
let retryCount = 0
const MAX_RETRIES = 3

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  console.log('📤 API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    hasAuth: !!token,
    data: config.data ? 'Has data' : 'No data'
  })
  
  return config
}, (error) => {
  console.error('❌ Request setup error:', error)
  return Promise.reject(error)
})

// Handle auth errors and log responses
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data ? 'Has data' : 'No data'
    })
    retryCount = 0 // Reset retry count on successful response
    return response
  },
  (error) => {
    const originalRequest = error.config
    
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      code: error.code
    })
    
    // Handle network errors with retry logic
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
      if (retryCount < MAX_RETRIES && !originalRequest._retry) {
        retryCount++
        originalRequest._retry = true
        
        console.log(`🔄 Retrying request (${retryCount}/${MAX_RETRIES})...`)
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(api(originalRequest))
          }, 1000 * retryCount) // Exponential backoff
        })
      } else {
        console.error('🚫 Max retries reached or server unavailable')
        // Check if server is running
        if (error.code === 'ECONNREFUSED') {
          console.error('💡 Make sure the backend server is running on port 3001')
        }
      }
    }
    
    if (error.response?.status === 401) {
      console.log('🔑 Unauthorized - removing token')
      localStorage.removeItem('auth_token')
      // Don't redirect automatically, let components handle it
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  healthCheck: () => {
    console.log('🏥 Checking backend health')
    return api.get('/health')
  },
  
  getNonce: (walletAddress: string) => {
    console.log('🔍 Getting nonce for:', walletAddress)
    return api.get(`/auth/nonce/${walletAddress}`)
  },
  
  verify: (walletAddress: string, signature: string, message: string) => {
    console.log('🔐 Verifying signature for:', walletAddress)
    return api.post('/auth/verify', { walletAddress, signature, message })
  },
  
  getProfile: () => {
    console.log('👤 Getting user profile')
    return api.get('/auth/profile')
  },
  
  refreshToken: () => api.post('/auth/refresh'),
  
  logout: () => api.post('/auth/logout'),
}

// Company API
export const companyAPI = {
  getProfile: () => {
    console.log('🏢 Getting company profile')
    return api.get('/company/profile')
  },
  
  saveProfile: (data: any) => {
    console.log('💾 Saving company profile:', data.name)
    return api.post('/company/profile', data)
  },
  
  updateSettings: (settings: any) => api.put('/company/settings', settings),
  
  getStats: () => api.get('/company/stats'),
  
  setContract: (contractAddress: string, transactionHash: string) => {
    console.log('🔗 Setting contract address:', contractAddress)
    return api.post('/company/contract', { contractAddress, transactionHash })
  },
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
    console.log('📁 Uploading file to IPFS:', file.name, file.size)
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/ipfs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  uploadJSON: (metadata: any, filename?: string) => {
    console.log('📄 Uploading JSON to IPFS:', filename)
    return api.post('/ipfs/upload-json', { metadata, filename })
  },
  
  uploadCertificate: (pdfData: string, certificateId: string, recipientName: string) => {
    console.log('📜 Uploading certificate to IPFS:', certificateId)
    return api.post('/ipfs/upload-certificate', { pdfData, certificateId, recipientName })
  },
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
  check: () => {
    console.log('🏥 Health check')
    return api.get('/health')
  }
}

// Test API connection
export const testAPI = {
  test: () => {
    console.log('🧪 Testing API connection')
    return api.get('/test')
  }
}

export default api