import React from 'react'
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle, 
  Triangle, 
  Minus,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { CanvasElement } from './Canvas'

interface LayersPanelProps {
  elements: CanvasElement[]
  selectedElementId: string | null
  onElementSelect: (id: string | null) => void
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void
  onElementsReorder: (elements: CanvasElement[]) => void
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onElementsReorder
}) => {
  const getElementIcon = (element: CanvasElement) => {
    switch (element.type) {
      case 'text':
        return <Type className="h-4 w-4" />
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'shape':
        if (element.shapeType === 'circle') return <Circle className="h-4 w-4" />
        if (element.shapeType === 'triangle') return <Triangle className="h-4 w-4" />
        return <Square className="h-4 w-4" />
      case 'line':
        return <Minus className="h-4 w-4" />
      default:
        return <Square className="h-4 w-4" />
    }
  }

  const getElementName = (element: CanvasElement) => {
    switch (element.type) {
      case 'text':
        return element.text?.substring(0, 20) + (element.text && element.text.length > 20 ? '...' : '') || 'Texte'
      case 'image':
        return 'Image'
      case 'shape':
        return element.shapeType === 'circle' ? 'Cercle' : 
               element.shapeType === 'triangle' ? 'Triangle' : 'Rectangle'
      case 'line':
        return 'Ligne'
      default:
        return 'Élément'
    }
  }

  const moveElementUp = (elementId: string) => {
    const element = elements.find(el => el.id === elementId)
    if (!element) return

    const newZIndex = element.zIndex + 1
    onElementUpdate(elementId, { zIndex: newZIndex })
  }

  const moveElementDown = (elementId: string) => {
    const element = elements.find(el => el.id === elementId)
    if (!element) return

    const newZIndex = Math.max(0, element.zIndex - 1)
    onElementUpdate(elementId, { zIndex: newZIndex })
  }

  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex)

  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Calques</h3>
      </div>
      
      <div className="p-2">
        {sortedElements.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Square className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun élément</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedElements.map((element) => (
              <div
                key={element.id}
                className={`group flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors duration-200 ${
                  selectedElementId === element.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onElementSelect(element.id)}
              >
                {/* Element icon */}
                <div className={`flex-shrink-0 ${element.visible ? 'text-gray-600' : 'text-gray-300'}`}>
                  {getElementIcon(element)}
                </div>
                
                {/* Element name */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${
                    element.visible ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {getElementName(element)}
                  </p>
                </div>
                
                {/* Controls */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {/* Move up/down */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      moveElementUp(element.id)
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Monter"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      moveElementDown(element.id)
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Descendre"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  
                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onElementUpdate(element.id, { visible: !element.visible })
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title={element.visible ? 'Masquer' : 'Afficher'}
                  >
                    {element.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                  
                  {/* Lock toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onElementUpdate(element.id, { locked: !element.locked })
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title={element.locked ? 'Déverrouiller' : 'Verrouiller'}
                  >
                    {element.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LayersPanel