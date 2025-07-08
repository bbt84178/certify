import React from 'react'
import { ChromePicker } from 'react-color'
import { 
  Type, 
  Palette, 
  Move, 
  RotateCw, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Crop,
  Scissors
} from 'lucide-react'
import { CanvasElement } from './Canvas'

interface PropertiesPanelProps {
  selectedElement: CanvasElement | null
  onElementUpdate: (id: string, updates: Partial<CanvasElement>) => void
  onElementDelete: (id: string) => void
  onElementDuplicate: (id: string) => void
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onElementUpdate,
  onElementDelete,
  onElementDuplicate
}) => {
  const [showColorPicker, setShowColorPicker] = React.useState<string | null>(null)
  const [cropMode, setCropMode] = React.useState(false)

  if (!selectedElement) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Sélectionnez un élément pour modifier ses propriétés</p>
        </div>
      </div>
    )
  }

  const updateElement = (updates: Partial<CanvasElement>) => {
    onElementUpdate(selectedElement.id, updates)
  }

  const fontFamilies = [
    'Arial, sans-serif',
    'Georgia, serif',
    'Times New Roman, serif',
    'Helvetica, sans-serif',
    'Verdana, sans-serif',
    'Courier New, monospace',
    'Impact, sans-serif',
    'Comic Sans MS, cursive'
  ]

  const fontWeights = [
    { value: 'normal', label: 'Normal' },
    { value: 'bold', label: 'Gras' },
    { value: 'lighter', label: 'Léger' }
  ]

  const textAlignments = [
    { value: 'left', icon: <AlignLeft className="h-4 w-4" /> },
    { value: 'center', icon: <AlignCenter className="h-4 w-4" /> },
    { value: 'right', icon: <AlignRight className="h-4 w-4" /> }
  ]

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Element info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedElement.type === 'text' && 'Propriétés du texte'}
            {selectedElement.type === 'image' && 'Propriétés de l\'image'}
            {selectedElement.type === 'shape' && 'Propriétés de la forme'}
            {selectedElement.type === 'line' && 'Propriétés de la ligne'}
          </h3>
        </div>

        {/* Position and size */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
            <Move className="h-4 w-4" />
            <span>Position et taille</span>
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X</label>
              <input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => updateElement({ x: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => updateElement({ y: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Largeur</label>
              <input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => updateElement({ width: parseInt(e.target.value) || 1 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hauteur</label>
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => updateElement({ height: parseInt(e.target.value) || 1 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Rotation and opacity */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
            <RotateCw className="h-4 w-4" />
            <span>Transformation</span>
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rotation (°)</label>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedElement.rotation}
                onChange={(e) => updateElement({ rotation: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{selectedElement.rotation}°</span>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Opacité</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedElement.opacity}
                onChange={(e) => updateElement({ opacity: parseFloat(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{Math.round(selectedElement.opacity * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Text properties */}
        {selectedElement.type === 'text' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
              <Type className="h-4 w-4" />
              <span>Texte</span>
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Contenu</label>
                <textarea
                  value={selectedElement.text || ''}
                  onChange={(e) => updateElement({ text: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Police</label>
                <select
                  value={selectedElement.fontFamily || 'Arial, sans-serif'}
                  onChange={(e) => updateElement({ fontFamily: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  {fontFamilies.map(font => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font.split(',')[0]}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Taille</label>
                  <input
                    type="number"
                    value={selectedElement.fontSize || 16}
                    onChange={(e) => updateElement({ fontSize: parseInt(e.target.value) || 16 })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    min="8"
                    max="200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Poids</label>
                  <select
                    value={selectedElement.fontWeight || 'normal'}
                    onChange={(e) => updateElement({ fontWeight: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    {fontWeights.map(weight => (
                      <option key={weight.value} value={weight.value}>
                        {weight.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Alignement</label>
                <div className="flex space-x-1">
                  {textAlignments.map(align => (
                    <button
                      key={align.value}
                      onClick={() => updateElement({ textAlign: align.value as any })}
                      className={`p-2 rounded border ${
                        selectedElement.textAlign === align.value
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      {align.icon}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Couleur</label>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    style={{ backgroundColor: selectedElement.color || '#000000' }}
                    onClick={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')}
                  />
                  <input
                    type="text"
                    value={selectedElement.color || '#000000'}
                    onChange={(e) => updateElement({ color: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
                  />
                </div>
                {showColorPicker === 'text' && (
                  <div className="absolute z-10 mt-2">
                    <div
                      className="fixed inset-0"
                      onClick={() => setShowColorPicker(null)}
                    />
                    <ChromePicker
                      color={selectedElement.color || '#000000'}
                      onChange={(color) => updateElement({ color: color.hex })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image properties */}
        {selectedElement.type === 'image' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
              <Crop className="h-4 w-4" />
              <span>Image</span>
            </h4>
            <div className="space-y-3">
              <button
                onClick={() => setCropMode(!cropMode)}
                className={`w-full p-2 rounded border flex items-center justify-center space-x-2 ${
                  cropMode ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300'
                }`}
              >
                <Scissors className="h-4 w-4" />
                <span>{cropMode ? 'Terminer le recadrage' : 'Recadrer l\'image'}</span>
              </button>
              
              {selectedElement.cropX !== undefined && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Recadrage X</label>
                    <input
                      type="number"
                      value={selectedElement.cropX || 0}
                      onChange={(e) => updateElement({ cropX: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Recadrage Y</label>
                    <input
                      type="number"
                      value={selectedElement.cropY || 0}
                      onChange={(e) => updateElement({ cropY: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shape properties */}
        {selectedElement.type === 'shape' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span>Forme</span>
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Couleur de remplissage</label>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    style={{ backgroundColor: selectedElement.fillColor || '#000000' }}
                    onClick={() => setShowColorPicker(showColorPicker === 'fill' ? null : 'fill')}
                  />
                  <input
                    type="text"
                    value={selectedElement.fillColor || '#000000'}
                    onChange={(e) => updateElement({ fillColor: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
                  />
                </div>
                {showColorPicker === 'fill' && (
                  <div className="absolute z-10 mt-2">
                    <div
                      className="fixed inset-0"
                      onClick={() => setShowColorPicker(null)}
                    />
                    <ChromePicker
                      color={selectedElement.fillColor || '#000000'}
                      onChange={(color) => updateElement({ fillColor: color.hex })}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Couleur de bordure</label>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    style={{ backgroundColor: selectedElement.strokeColor || '#000000' }}
                    onClick={() => setShowColorPicker(showColorPicker === 'stroke' ? null : 'stroke')}
                  />
                  <input
                    type="text"
                    value={selectedElement.strokeColor || '#000000'}
                    onChange={(e) => updateElement({ strokeColor: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
                  />
                </div>
                {showColorPicker === 'stroke' && (
                  <div className="absolute z-10 mt-2">
                    <div
                      className="fixed inset-0"
                      onClick={() => setShowColorPicker(null)}
                    />
                    <ChromePicker
                      color={selectedElement.strokeColor || '#000000'}
                      onChange={(color) => updateElement({ strokeColor: color.hex })}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Épaisseur bordure</label>
                <input
                  type="number"
                  value={selectedElement.strokeWidth || 0}
                  onChange={(e) => updateElement({ strokeWidth: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  min="0"
                  max="20"
                />
              </div>
            </div>
          </div>
        )}

        {/* Layer controls */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Calque</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Z-Index</span>
              <input
                type="number"
                value={selectedElement.zIndex}
                onChange={(e) => updateElement({ zIndex: parseInt(e.target.value) || 0 })}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => updateElement({ visible: !selectedElement.visible })}
                className={`flex-1 p-2 rounded border flex items-center justify-center space-x-1 ${
                  selectedElement.visible ? 'border-gray-300' : 'border-red-300 bg-red-50'
                }`}
              >
                {selectedElement.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span className="text-xs">{selectedElement.visible ? 'Visible' : 'Masqué'}</span>
              </button>
              
              <button
                onClick={() => updateElement({ locked: !selectedElement.locked })}
                className={`flex-1 p-2 rounded border flex items-center justify-center space-x-1 ${
                  selectedElement.locked ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
                }`}
              >
                {selectedElement.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                <span className="text-xs">{selectedElement.locked ? 'Verrouillé' : 'Libre'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => onElementDuplicate(selectedElement.id)}
              className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 text-sm"
            >
              Dupliquer
            </button>
            <button
              onClick={() => onElementDelete(selectedElement.id)}
              className="flex-1 p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 text-sm"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertiesPanel