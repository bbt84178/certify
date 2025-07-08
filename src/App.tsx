import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiConfig } from 'wagmi'
import { Toaster } from 'react-hot-toast'
import { wagmiConfig } from './config/wagmi'
import { AnimatePresence } from 'framer-motion'

// Pages
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import CertificateEditor from './pages/CertificateEditor'
import CertificateCreator from './pages/CertificateCreator'
import CertificateVerification from './pages/CertificateVerification'
import PublicGallery from './pages/PublicGallery'
import CompanySettings from './pages/CompanySettings'

// Components
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Navbar />
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/verify" element={<CertificateVerification />} />
                <Route path="/gallery" element={<PublicGallery />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/editor" 
                  element={
                    <ProtectedRoute>
                      <CertificateEditor />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/create" 
                  element={
                    <ProtectedRoute>
                      <CertificateCreator />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <CompanySettings />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </AnimatePresence>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </QueryClientProvider>
    </WagmiConfig>
  )
}

export default App