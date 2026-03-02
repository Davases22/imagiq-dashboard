"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Store,
  MapPin,
  Clock,
  Phone,
  Mail,
  Building2,
  Hash,
  Globe,
} from "lucide-react";
import type { BackendTienda } from "@/lib/api";

interface StoreDetailDialogProps {
  open: boolean;
  onClose: () => void;
  store: BackendTienda | null;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

export function StoreDetailDialog({
  open,
  onClose,
  store,
}: StoreDetailDialogProps) {
  if (!store) return null;

  const telefono = store.telefono
    ? `${store.telefono}${store.extension ? ` ext. ${store.extension}` : ""}`
    : null;

  const ubicacion = [store.ciudad, store.departamento]
    .filter(Boolean)
    .join(", ");

  const lat = store.latitud?.trim();
  const lng = store.longitud?.trim();
  const hasCoords = lat && lng && lat !== "0" && lng !== "0";
  const addressQuery = [store.direccion, store.ciudad, store.departamento]
    .filter(Boolean)
    .join(", ");

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : addressQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`
      : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {store.descripcion || store.codBodega}
          </DialogTitle>
          {ubicacion && (
            <DialogDescription>{ubicacion}</DialogDescription>
          )}
        </DialogHeader>

        <div className="divide-y">
          <DetailRow icon={Hash} label="Código" value={store.codigo} />
          <DetailRow icon={Building2} label="Cod. Bodega" value={store.codBodega} />
          {store.codDane && (
            <DetailRow icon={Hash} label="Cod. DANE" value={store.codDane} />
          )}
          <DetailRow
            icon={MapPin}
            label="Dirección"
            value={
              [store.direccion, store.ubicacion_cc].filter(Boolean).join(" — ") || undefined
            }
          />
          <DetailRow icon={Clock} label="Horario" value={store.horario} />
          <DetailRow icon={Phone} label="Teléfono" value={telefono} />
          <DetailRow icon={Mail} label="Email" value={store.email} />

          {googleMapsUrl && (
            <div className="flex items-start gap-3 py-2">
              <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Ubicación</p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Ver en Google Maps
                </a>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
