'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PaymentProcessor, PaymentProcessorConfig } from '@/types';

const STORAGE_KEY = 'active-payment-processor';
const DEFAULT_PROCESSOR: PaymentProcessor = 'epayco';

// Configuración de procesadores disponibles
export const PAYMENT_PROCESSORS: PaymentProcessorConfig[] = [
  {
    id: 'epayco',
    name: 'ePayco',
    logo: 'https://epayco.com/wp-content/uploads/2021/06/epayco.png',
    logoDark: 'https://epayco.com/wp-content/uploads/2021/06/epayco-1.png',
    enabled: true,
    description: 'Procesador de pagos colombiano con soporte para tarjetas, PSE y más',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    logo: 'https://static.vecteezy.com/system/resources/previews/067/065/678/non_2x/mercadopago-logo-square-rounded-mercadopago-logo-free-download-mercadopago-logo-free-png.png',
    enabled: true,
    description: 'Procesador de pagos líder en Latinoamérica',
  },
];

export function usePaymentProcessors() {
  const [activeProcessor, setActiveProcessor] = useState<PaymentProcessor>(DEFAULT_PROCESSOR);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar procesador activo desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'epayco' || stored === 'mercadopago')) {
        setActiveProcessor(stored as PaymentProcessor);
      }
    } catch (error) {
      console.error('Error loading payment processor from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cambiar procesador activo
  const setProcessor = useCallback((processor: PaymentProcessor) => {
    try {
      localStorage.setItem(STORAGE_KEY, processor);
      setActiveProcessor(processor);
    } catch (error) {
      console.error('Error saving payment processor to localStorage:', error);
      throw error;
    }
  }, []);

  // Obtener configuración del procesador activo
  const getActiveProcessorConfig = useCallback((): PaymentProcessorConfig | undefined => {
    return PAYMENT_PROCESSORS.find((p) => p.id === activeProcessor);
  }, [activeProcessor]);

  // Obtener todos los procesadores
  const getAllProcessors = useCallback((): PaymentProcessorConfig[] => {
    return PAYMENT_PROCESSORS;
  }, []);

  return {
    activeProcessor,
    setProcessor,
    getActiveProcessorConfig,
    getAllProcessors,
    isLoading,
  };
}
