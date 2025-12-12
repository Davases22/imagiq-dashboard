/**
 * Hook optimizado para gestionar bloques de contenido
 * Cada bloque puede contener: título, subtítulo, descripción y CTA
 * Los elementos se agrupan y mueven juntos como un bloque
 */

import { useState, useCallback } from 'react';
import type { ContentBlock } from '@/types/banner';
import { v4 as uuidv4 } from 'uuid';

interface UseContentBlocksReturn {
  blocks: ContentBlock[];
  addBlock: () => ContentBlock;
  removeBlock: (id: string) => void;
  updateBlock: (id: string, updates: Partial<ContentBlock>) => void;
  updateBlockPosition: (id: string, device: 'desktop' | 'mobile', position: { x: number; y: number }) => void;
  clearAll: () => void;
  importBlocks: (blocks?: ContentBlock[]) => void;
}

/**
 * Hook principal para gestionar bloques de contenido
 */
export function useContentBlocks(): UseContentBlocksReturn {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  // Agregar nuevo bloque con valores por defecto
  const addBlock = useCallback(() => {
    const newBlock: ContentBlock = {
      id: uuidv4(),
      position_desktop: { x: 50, y: 50 },
      position_mobile: { x: 50, y: 50 },
      textAlign: 'left',
      maxWidth: '600px',
      gap: '12px',
      // Bloque vacío, el usuario agrega elementos
    };

    setBlocks(prev => [...prev, newBlock]);
    return newBlock;
  }, []);

  // Eliminar bloque por ID
  const removeBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
  }, []);

  // Actualizar propiedades del bloque
  const updateBlock = useCallback((id: string, updates: Partial<ContentBlock>) => {
    setBlocks(prev => prev.map(block => 
      block.id === id 
        ? { ...block, ...updates }
        : block
    ));
  }, []);

  // Actualizar posición del bloque para un dispositivo específico
  const updateBlockPosition = useCallback((
    id: string, 
    device: 'desktop' | 'mobile', 
    position: { x: number; y: number }
  ) => {
    const positionKey = device === 'desktop' ? 'position_desktop' : 'position_mobile';
    updateBlock(id, { [positionKey]: position });
  }, [updateBlock]);

  // Limpiar todos los bloques
  const clearAll = useCallback(() => {
    setBlocks([]);
  }, []);

  // Importar bloques existentes (para modo edición)
  const importBlocks = useCallback((importedBlocks?: ContentBlock[]) => {
    if (importedBlocks && importedBlocks.length > 0) {
      setBlocks(importedBlocks);
    }
  }, []);

  return {
    blocks,
    addBlock,
    removeBlock,
    updateBlock,
    updateBlockPosition,
    clearAll,
    importBlocks,
  };
}
