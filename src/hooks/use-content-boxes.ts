/**
 * Hook optimizado para gestionar cajas de contenido
 * Maneja título, descripción y CTA boxes con posiciones independientes
 */

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ContentBox, CTABox } from '@/types/banner';

type BoxType = 'title' | 'description' | 'cta';
type Device = 'desktop' | 'mobile';

interface UseContentBoxesReturn {
  // Estado
  titleBoxes: ContentBox[];
  descriptionBoxes: ContentBox[];
  ctaBoxes: CTABox[];
  
  // Acciones
  addBox: (type: BoxType) => void;
  removeBox: (type: BoxType, id: string) => void;
  updateBox: (type: BoxType, id: string, updates: Partial<ContentBox | CTABox>) => void;
  updateBoxPosition: (type: BoxType, id: string, device: Device, position: { x: number; y: number }) => void;
  
  // Utilidades
  getBoxCount: () => { title: number; description: number; cta: number; total: number };
  clearAll: () => void;
  importBoxes: (titleBoxes: ContentBox[], descriptionBoxes: ContentBox[], ctaBoxes: CTABox[]) => void;
}

export function useContentBoxes(): UseContentBoxesReturn {
  const [titleBoxes, setTitleBoxes] = useState<ContentBox[]>([]);
  const [descriptionBoxes, setDescriptionBoxes] = useState<ContentBox[]>([]);
  const [ctaBoxes, setCtaBoxes] = useState<CTABox[]>([]);

  // Agregar nueva caja con valores por defecto
  const addBox = useCallback((type: BoxType) => {
    // Determinar valores según el tipo
    let text: string;
    let fontSize: string;
    let fontWeight: string;

    if (type === 'title') {
      text = 'Nuevo Título';
      fontSize = '2rem';
      fontWeight = '700';
    } else if (type === 'description') {
      text = 'Nueva Descripción';
      fontSize = '1.2rem';
      fontWeight = '400';
    } else {
      text = 'Click Aquí';
      fontSize = '1rem';
      fontWeight = '600';
    }

    const newBox = {
      id: uuidv4(),
      text,
      position_desktop: { x: 50, y: 50 },
      position_mobile: { x: 50, y: 50 },
      styles: {
        fontSize,
        fontWeight,
        color: '#ffffff',
        textAlign: 'left' as const,
        whiteSpace: 'pre-line' as const,
      },
      ...(type === 'cta' && { 
        link_url: '#',
        styles: {
          fontSize: '1rem',
          fontWeight: '600',
          backgroundColor: '#ffffff',
          color: '#000000',
          padding: '12px 24px',
          borderRadius: '8px',
        }
      }),
    };

    switch (type) {
      case 'title':
        setTitleBoxes(prev => [...prev, newBox as ContentBox]);
        break;
      case 'description':
        setDescriptionBoxes(prev => [...prev, newBox as ContentBox]);
        break;
      case 'cta':
        setCtaBoxes(prev => [...prev, newBox as CTABox]);
        break;
    }
  }, []);

  // Eliminar caja
  const removeBox = useCallback((type: BoxType, id: string) => {
    switch (type) {
      case 'title':
        setTitleBoxes(prev => prev.filter(box => box.id !== id));
        break;
      case 'description':
        setDescriptionBoxes(prev => prev.filter(box => box.id !== id));
        break;
      case 'cta':
        setCtaBoxes(prev => prev.filter(box => box.id !== id));
        break;
    }
  }, []);

  // Actualizar propiedades de una caja
  const updateBox = useCallback((type: BoxType, id: string, updates: Partial<ContentBox | CTABox>) => {
    switch (type) {
      case 'title':
        setTitleBoxes(prev => prev.map(box => 
          box.id === id ? { ...box, ...updates } : box
        ));
        break;
      case 'description':
        setDescriptionBoxes(prev => prev.map(box => 
          box.id === id ? { ...box, ...updates } : box
        ));
        break;
      case 'cta':
        setCtaBoxes(prev => prev.map(box => 
          box.id === id ? { ...box, ...updates as Partial<CTABox> } : box
        ));
        break;
    }
  }, []);

  // Actualizar solo posición de una caja
  const updateBoxPosition = useCallback((
    type: BoxType, 
    id: string, 
    device: Device, 
    position: { x: number; y: number }
  ) => {
    const positionKey = device === 'desktop' ? 'position_desktop' : 'position_mobile';
    updateBox(type, id, { [positionKey]: position });
  }, [updateBox]);

  // Obtener conteo de cajas
  const getBoxCount = useCallback(() => ({
    title: titleBoxes.length,
    description: descriptionBoxes.length,
    cta: ctaBoxes.length,
    total: titleBoxes.length + descriptionBoxes.length + ctaBoxes.length,
  }), [titleBoxes.length, descriptionBoxes.length, ctaBoxes.length]);

  // Limpiar todas las cajas
  const clearAll = useCallback(() => {
    setTitleBoxes([]);
    setDescriptionBoxes([]);
    setCtaBoxes([]);
  }, []);

  // Importar cajas existentes (al cargar un banner)
  const importBoxes = useCallback((
    newTitleBoxes: ContentBox[], 
    newDescriptionBoxes: ContentBox[], 
    newCtaBoxes: CTABox[]
  ) => {
    setTitleBoxes(newTitleBoxes);
    setDescriptionBoxes(newDescriptionBoxes);
    setCtaBoxes(newCtaBoxes);
  }, []);

  return {
    titleBoxes,
    descriptionBoxes,
    ctaBoxes,
    addBox,
    removeBox,
    updateBox,
    updateBoxPosition,
    getBoxCount,
    clearAll,
    importBoxes,
  };
}
