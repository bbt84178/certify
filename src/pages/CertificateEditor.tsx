import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import { 
  Save, 
  Download, 
  Upload, 
  Undo, 
  Redo, 
  Grid,
  Ruler,
  Settings
} from 'lucide-react'
import Canvas, { CanvasElement } from '../components/CertificateEditor/Canvas'
import Toolbar from '../components/CertificateEditor/Toolbar'
import PropertiesPanel from '../components/CertificateEditor/PropertiesPanel'
import LayersPanel from '../components/CertificateEditor/LayersPanel'
import { useCertificateStore } from '../store/useCertificateStore'
import { useIPFS } from '../hooks/useIPFS'
import toast from 'react-hot-toast'

const CertificateEditor: React.FC = () => {
  const { t } = useTranslation()
  const { template, setTemplate } = useCertificateStore()
  const { uploadFile, uploadJSON, uploading } = useIPFS()
  
  // Canvas state
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState('select')
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [showRulers, setShowRulers] = useState(true)
  
  // Canvas dimensions
  const canvasWidth = 1200
  const canvasHeight = 900
  
  // History for undo/redo
  const [history, setHistory] = useState<CanvasElement[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Background upload
  const backgroundDropzone = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file) {
        try {
          const result = await uploadFile(file)
          setBackgroundImage(result.url)
          toast.success('Arrière-plan mis à jour!')
        } catch (error) {
          toast.error('Erreur lors du téléchargement')
        }
      }
    }
  })

  // Add element to canvas
  const addElement = useCallback((type: string, data?: any) => {
    const newElement: CanvasElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      x: canvasWidth / 2 - 100,
      y: canvasHeight / 2 - 50,
      width: 200,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: elements.length,
      ...data
    }

    // Type-specific defaults
    if (type === 'text') {
      newElement.text = data?.text || 'Nouveau texte'
      newElement.fontSize = 24
      newElement.fontFamily = 'Arial, sans-serif'
      newElement.fontWeight = 'normal'
      newElement.color = '#000000'
      newElement.textAlign = 'center'
      newElement.width = 300
      newElement.height = 50
    } else if (type === 'image') {
      newElement.src = data?.src
      newElement.width = 200
      newElement.height = 200
    } else if (type === 'shape') {
      newElement.shapeType = data?.shapeType || 'rectangle'
      newElement.fillColor = '#3B82F6'
      newElement.strokeColor = '#1E40AF'
      newElement.strokeWidth = 2
      newElement.width = 150
      newElement.height = 150
    } else if (type === 'line') {
      newElement.strokeColor = '#000000'
      newElement.strokeWidth = 2
      newElement.lineType = 'solid'
      newElement.width = 200
      newElement.height = 2
    }

    const newElements = [...elements, newElement]
    setElements(newElements)
    setSelectedElementId(newElement.id)
    addToHistory(newElements)
  }, [elements])

  // Update element
  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
    setElements(newElements)
    addToHistory(newElements)
  }, [elements])

  // Delete element
  const deleteElement = useCallback((id: string) => {
    const newElements = elements.filter(el => el.id !== id)
    setElements(newElements)
    setSelectedElementId(null)
    addToHistory(newElements)
  }, [elements])

  // Duplicate element
  const duplicateElement = useCallback((id: string) => {
    const element = elements.find(el => el.id === id)
    if (!element) return

    const newElement: CanvasElement = {
      ...element,
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: element.x + 20,
      y: element.y + 20,
      zIndex: elements.length
    }

    const newElements = [...elements, newElement]
    setElements(newElements)
    setSelectedElementId(newElement.id)
    addToHistory(newElements)
  }, [elements])

  // History management
  const addToHistory = (newElements: CanvasElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...newElements])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setElements([...history[historyIndex - 1]])
      setSelectedElementId(null)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setElements([...history[historyIndex + 1]])
      setSelectedElementId(null)
    }
  }

  // Save template
  const saveTemplate = async () => {
    try {
      const templateData = {
        id: Date.now().toString(),
        name: 'Mon Template',
        background: backgroundImage,
        elements,
        canvasWidth,
        canvasHeight,
        createdAt: new Date().toISOString()
      }

      // Upload to IPFS
      const result = await uploadJSON(templateData, 'certificate-template.json')
      
      setTemplate({
        ...templateData,
        ipfsHash: result.cid,
        ipfsUrl: result.url
      })

      toast.success('Template sauvegardé avec succès!')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  // Export as image
  const exportAsImage = () => {
    // Implementation for exporting canvas as image
    toast.info('Export en cours de développement...')
  }

  const selectedElement = elements.find(el => el.id === selectedElementId) || null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Éditeur de Certificat
            </h1>
            <p className="text-gray-600">
              Créez et personnalisez votre template de certificat
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Undo/Redo */}
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Annuler"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refaire"
            >
              <Redo className="h-4 w-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-300" />
            
            {/* View options */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg border transition-colors duration-200 ${
                showGrid ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200'
              }`}
              title="Grille"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowRulers(!showRulers)}
              className={`p-2 rounded-lg border transition-colors duration-200 ${
                showRulers ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200'
              }`}
              title="Règles"
            >
              <Ruler className="h-4 w-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-300" />
            
            {/* Actions */}
            <button
              onClick={exportAsImage}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exporter</span>
            </button>
            <button
              onClick={saveTemplate}
              disabled={uploading}
              className="btn-primary flex items-center space-x-2"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Sauvegarder</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Toolbar */}
      <Toolbar
        selectedTool={selectedTool}
        onToolSelect={setSelectedTool}
        onAddElement={addElement}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Layers panel */}
        <LayersPanel
          elements={elements}
          selectedElementId={selectedElementId}
          onElementSelect={setSelectedElementId}
          onElementUpdate={updateElement}
          onElementsReorder={setElements}
        />

        {/* Canvas area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas controls */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Background upload */}
                <div
                  {...backgroundDropzone.getRootProps()}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors duration-200"
                >
                  <input {...backgroundDropzone.getInputProps()} />
                  <Upload className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Arrière-plan</span>
                </div>
                
                {backgroundImage && (
                  <button
                    onClick={() => setBackgroundImage('')}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Supprimer l'arrière-plan
                  </button>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                {canvasWidth} × {canvasHeight} px
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 p-8 overflow-auto">
            <Canvas
              elements={elements}
              selectedElementId={selectedElementId}
              onElementsChange={setElements}
              onElementSelect={setSelectedElementId}
              backgroundImage={backgroundImage}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              zoom={zoom}
            />
          </div>
        </div>

        {/* Properties panel */}
        <PropertiesPanel
          selectedElement={selectedElement}
          onElementUpdate={updateElement}
          onElementDelete={deleteElement}
          onElementDuplicate={duplicateElement}
        />
      </div>
    </div>
  )
}

export default CertificateEditor