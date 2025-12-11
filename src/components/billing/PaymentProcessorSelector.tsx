'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { usePaymentProcessors } from '@/hooks/usePaymentProcessors';
import type { PaymentProcessor, PaymentProcessorConfig } from '@/types';

export function PaymentProcessorSelector() {
  const { theme, resolvedTheme } = useTheme();
  const { activeProcessor, setProcessor, getAllProcessors, isLoading } = usePaymentProcessors();
  const [changingTo, setChangingTo] = useState<PaymentProcessor | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingProcessor, setPendingProcessor] = useState<PaymentProcessorConfig | null>(null);
  const [mounted, setMounted] = useState(false);

  const processors = getAllProcessors();

  // Esperar a que el componente monte para evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleProcessorClick = (processor: PaymentProcessorConfig) => {
    if (processor.id === activeProcessor || changingTo) return;

    setPendingProcessor(processor);
    setShowConfirmDialog(true);
  };

  const handleConfirmChange = async () => {
    if (!pendingProcessor) return;

    try {
      setChangingTo(pendingProcessor.id);
      setShowConfirmDialog(false);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simular delay
      setProcessor(pendingProcessor.id);
    } catch (error) {
      console.error('Error changing payment processor:', error);
    } finally {
      setChangingTo(null);
      setPendingProcessor(null);
    }
  };

  const handleCancelChange = () => {
    setShowConfirmDialog(false);
    setPendingProcessor(null);
  };

  const getLogoUrl = (processor: PaymentProcessorConfig): string => {
    // Si el componente no ha montado, usar logo claro por defecto
    if (!mounted) {
      return processor.logo;
    }

    // Obtener el tema resuelto (el que realmente se está usando)
    const currentTheme = resolvedTheme || theme;

    // Si el procesador tiene logo oscuro y el tema es oscuro, usarlo
    if (currentTheme === 'dark' && processor.logoDark) {
      return processor.logoDark;
    }
    return processor.logo;
  };

  if (isLoading || !mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {processors.map((processor) => {
            const isActive = processor.id === activeProcessor;
            const isChanging = changingTo === processor.id;

            return (
              <button
                key={processor.id}
                onClick={() => handleProcessorClick(processor)}
                disabled={isChanging || !processor.enabled}
                className={cn(
                  'relative flex items-center gap-4 px-5 py-6 rounded-lg border-2 transition-all duration-200',
                  'hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50',
                  isActive
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/50',
                  isChanging && 'opacity-50'
                )}
              >
                {/* Logo */}
                <div className="relative w-28 h-12 flex-shrink-0 flex items-center">
                  <Image
                    src={getLogoUrl(processor)}
                    alt={processor.name}
                    width={112}
                    height={48}
                    className="object-contain object-left"
                    unoptimized
                    key={getLogoUrl(processor)} // Force re-render cuando cambia el logo
                  />
                </div>

                {/* Información */}
                <div className="flex-1 text-left min-w-0">
                  <h3 className="text-base font-semibold mb-0.5">{processor.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                    {processor.description}
                  </p>
                </div>

                {/* Badge de estado */}
                <div className="flex-shrink-0">
                  {isActive ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      <Check className="h-3 w-3" />
                      Activo
                    </div>
                  ) : processor.enabled ? (
                    <div className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                      Disponible
                    </div>
                  ) : (
                    <div className="px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs font-medium">
                      Próximamente
                    </div>
                  )}
                </div>

                {/* Loader al cambiar */}
                {isChanging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Información adicional */}
        <div className="rounded-lg border bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground leading-snug">
            <strong className="text-foreground">Nota:</strong> El procesador seleccionado se utilizará para todas las nuevas transacciones.
          </p>
        </div>
      </div>

      {/* Modal de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              </div>
              <AlertDialogTitle className="text-xl">
                Confirmar cambio de procesador
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base space-y-3 pt-2">
              <p>
                ¿Estás seguro de que deseas cambiar a{' '}
                <strong className="text-foreground">{pendingProcessor?.name}</strong>?
              </p>
              <p className="text-sm">
                Este cambio afectará a todas las nuevas transacciones. 
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelChange}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>
              Confirmar cambio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
