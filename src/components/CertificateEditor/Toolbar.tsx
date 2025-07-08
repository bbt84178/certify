import React from 'react'
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle, 
  Triangle,
  Minus,
  Upload,
  ZoomIn,
  ZoomOut,
  MousePointer
} from 'lucide-react'

interface ToolbarProps {
  selectedTool: string
  onToolSelect: (tool: string) => void
  onAddElement: (type: string, data?: any) => void
  zoom: number
  onZoomChange: (zoom: number) => void
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolSelect,
  onAddElement,
  zoom,
  onZoomChange
}) => {
  const tools = [
    { id: 'select', icon: <MousePointer className="h-5 w-5" />, label: 'Sélectionner' },
    { id: 'text', icon: <Type className="h-5 w-5" />, label: 'Texte' },
    { id: 'image', icon: <ImageIcon className="h-5 w-5" />, label: 'Image' },
    { id: 'rectangle', icon: <Square className="h-5 w-5" />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle className="h-5 w-5" />, label: 'Cercle' },
    { id: 'triangle', icon: <Triangle className="h-5 w-5" />, label: 'Triangle' },
    { id: 'line', icon: <Minus className="h-5 w-5" />, label: 'Ligne' }
  ]

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        onAddElement('image', { src: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="bg-white p-4">
      <div className="flex items-center justify-between">
        {/* Tools */}
        <div className="flex items-center space-x-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                onToolSelect(tool.id)
                if (tool.id === 'text') {
                  onAddElement('text', { text: 'Nouveau texte' })
                } else if (tool.id === 'rectangle') {
                  onAddElement('shape', { shapeType: 'rectangle' })
                } else if (tool.id === 'circle') {
                  onAddElement('shape', { shapeType: 'circle' })
                } else if (tool.id === 'triangle') {
                  onAddElement('shape', { shapeType: 'triangle' })
                } else if (tool.id === 'line') {
                  onAddElement('line')
                }
              }}
              className={`toolbar-button ${selectedTool === tool.id ? 'active' : ''}`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
          
          {/* Image upload */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button className="toolbar-button">
              <Upload className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))}
            className="toolbar-button"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2, zoom + 0.25))}
            className="toolbar-button"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Toolbar