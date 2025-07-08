import { create } from 'zustand'

interface Certificate {
  id: string
  recipientName: string
  courseName: string
  issueDate: string
  recipientAddress: string
  ipfsHash: string
  transactionHash: string
  isPublic: boolean
}

interface Template {
  id: string
  name: string
  background: string
  logo: string
  signatures: string[]
  textElements: {
    recipientName: { x: number; y: number; fontSize: number; color: string }
    courseName: { x: number; y: number; fontSize: number; color: string }
    issueDate: { x: number; y: number; fontSize: number; color: string }
  }
}

interface CertificateState {
  certificates: Certificate[]
  template: Template | null
  isLoading: boolean
  setCertificates: (certificates: Certificate[]) => void
  addCertificate: (certificate: Certificate) => void
  setTemplate: (template: Template) => void
  setLoading: (loading: boolean) => void
}

export const useCertificateStore = create<CertificateState>((set) => ({
  certificates: [],
  template: null,
  isLoading: false,
  setCertificates: (certificates) => set({ certificates }),
  addCertificate: (certificate) => 
    set((state) => ({ certificates: [...state.certificates, certificate] })),
  setTemplate: (template) => set({ template }),
  setLoading: (loading) => set({ isLoading: loading }),
}))