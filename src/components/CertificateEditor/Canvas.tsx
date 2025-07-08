import React, { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle, 
  Triangle, 
  Minus
} from 'lucide-react'

export interface CanvasElement {
  id: string
  type: 'text' | 'image' | 'shape' | 'line'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  locked: boolean
  visible: boolean
  zIndex: number
  
  // Text specific
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  
  // Image specific
  src?: string
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
  
  // Shape specific
  shapeType?: 'rectangle' | 'circle' | 'triangle'
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  
  // Line specific
  lineType?: 'solid' | 'dashed' | 'dotted'
}

interface CanvasProps {
  elements: CanvasElement[]
  selectedElementId: string | null
  onElementsChange: (elements: CanvasElement[]) => void
  onElementSelect: (id: string | null) => void
  backgroundImage?: string
  canvasWidth: number
  canvasHeight: number
  zoom: number
}

const Canvas: React.FC<CanvasProps> = ({
  elements,
  selectedElementId,
  onElementsChange,
  onElementSelect,
  backgroundImage,
  canvasWidth,
  canvasHeight,
  zoom
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
    onElementsChange(newElements)
  }, [elements, onElementsChange])

  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    onElementSelect(elementId)
  }

  const handleCanvasClick = () => {
    onElementSelect(null)
  }

  const handleDrag = (elementId: string, x: number, y: number) => {
    updateElement(elementId, { x, y })
  }

  const handleResize = (elementId: string, width: number, height: number, x?: number, y?: number) => {
    const updates: Partial<CanvasElement> = { width, height }
    if (x !== undefined) updates.x = x
    if (y !== undefined) updates.y = y
    updateElement(elementId, updates)
  }

  const renderElement = (element: CanvasElement) => {
    if (!element.visible) return null

    const isSelected = element.id === selectedElementId
    const transform = `rotate(${element.rotation}deg)`

    const commonProps = {
      key: element.id,
      style: {
        position: 'absolute' as const,
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform,
        opacity: element.opacity,
        zIndex: element.zIndex,
        cursor: element.locked ? 'not-allowed' : 'move',
        pointerEvents: element.locked ? 'none' : 'auto'
      },
      onClick: (e: React.MouseEvent) => handleElementClick(e, element.id)
    }

    let content = null

    switch (element.type) {
      case 'text':
        content = (
          <div
            style={{
              fontSize: element.fontSize,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              color: element.color,
              textAlign: element.textAlign,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.textAlign === 'center' ? 'center' : 
                           element.textAlign === 'right' ? 'flex-end' : 'flex-start',
              wordWrap: 'break-word',
              overflow: 'hidden'
            }}
          >
            {element.text}
          </div>
        )
        break

      case 'image':
        content = (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <img
              src={element.src}
              alt=""
              style={{
                width: element.cropWidth ? `${(element.width / element.cropWidth) * 100}%` : '100%',
                height: element.cropHeight ? `${(element.height / element.cropHeight) * 100}%` : '100%',
                objectFit: 'cover',
                transform: element.cropX || element.cropY ? 
                  `translate(${-(element.cropX || 0)}px, ${-(element.cropY || 0)}px)` : 'none'
              }}
            />
          </div>
        )
        break

      case 'shape':
        const shapeStyle = {
          width: '100%',
          height: '100%',
          backgroundColor: element.fillColor,
          border: element.strokeWidth ? `${element.strokeWidth}px solid ${element.strokeColor}` : 'none'
        }

        if (element.shapeType === 'circle') {
          shapeStyle.borderRadius = '50%'
        } else if (element.shapeType === 'triangle') {
          content = (
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              <polygon
                points="50,10 90,90 10,90"
                fill={element.fillColor}
                stroke={element.strokeColor}
                strokeWidth={element.strokeWidth}
              />
            </svg>
          )
        }

        if (!content) {
          content = <div style={shapeStyle} />
        }
        break

      case 'line':
        content = (
          <svg width="100%" height="100%">
            <line
              x1="0"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke={element.strokeColor}
              strokeWidth={element.strokeWidth}
              strokeDasharray={
                element.lineType === 'dashed' ? '10,5' :
                element.lineType === 'dotted' ? '2,2' : 'none'
              }
            />
          </svg>
        )
        break
    }

    return (
      <motion.div
        {...commonProps}
        drag={!element.locked && !isResizing}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        onDrag={(_, info) => {
          if (!element.locked) {
            handleDrag(element.id, element.x + info.delta.x, element.y + info.delta.y)
          }
        }}
        className={`select-none ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      >
        {content}
        
        {/* Selection handles */}
        {isSelected && !element.locked && (
          <>
            {/* Resize handles */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" />
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-n-resize" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" />
            <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-e-resize" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" />
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-s-resize" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" />
            <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-w-resize" />
            
            {/* Rotation handle */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-green-500 rounded-full cursor-grab" />
          </>
        )}
      </motion.div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-gray-100 rounded-lg">
      <div
        ref={canvasRef}
        className="relative bg-white shadow-lg mx-auto"
        style={{
          width: canvasWidth * zoom,
          height: canvasHeight * zoom,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left'
        }}
        onClick={handleCanvasClick}
      >
        {/* Background */}
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          />
        )}
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            zIndex: 1
          }}
        />
        
        {/* Elements */}
        {elements
          .sort((a, b) => a.zIndex - b.zIndex)
          .map(renderElement)}
      </div>
    </div>
  )
}

export default Canvas