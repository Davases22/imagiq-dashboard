import { Receipt } from 'lucide-react';
import { PaymentProcessorSelector } from '@/components/billing/PaymentProcessorSelector';

export default function FacturacionPage() {
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Receipt className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Facturación</h1>
          <p className="text-xs text-muted-foreground">
            Gestión de facturas y configuración de procesadores de pago
          </p>
        </div>
      </div>

      {/* Sección de Procesadores de Pago */}
      <div className="space-y-2.5">
        <div>
          <h2 className="text-base font-semibold">Procesadores de Pago</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecciona el procesador que utilizarás para procesar las transacciones
          </p>
        </div>

        <PaymentProcessorSelector />
      </div>
    </div>
  );
}
