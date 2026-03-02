"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoresDataTable } from "@/components/physical-stores/stores-data-table";
import { PickupVerificationModal } from "@/components/physical-stores/pickup-verification-modal";
import { KioskAccountDialog } from "@/components/physical-stores/kiosk-account-dialog";
import { StoreDetailDialog } from "@/components/physical-stores/store-detail-dialog";
import type { BackendTienda } from "@/lib/api";
import {
  Store,
  Package,
  QrCode,
  BarChart3,
  Settings,
} from "lucide-react";
import { useTiendas } from "@/hooks/use-tiendas";
import { usePickupMetrics } from "@/hooks/use-pickup-metrics";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function PuntoFisicoPage() {
  const { tiendas, isLoading } = useTiendas();
  const {
    metrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
  } = usePickupMetrics();

  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [kioskDialogStore, setKioskDialogStore] = useState<BackendTienda | null>(null);
  const [isKioskDialogOpen, setIsKioskDialogOpen] = useState(false);
  const [detailStore, setDetailStore] = useState<BackendTienda | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleVerificationSuccess = () => {
    // Refrescar métricas después de una verificación exitosa
    refetchMetrics();
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Store className="h-8 w-8 text-blue-600" />
            Punto Físico
          </h1>
          <p className="text-muted-foreground">
            Gestión de tiendas físicas y verificación de recogidas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsVerificationModalOpen(true)}
          >
            <QrCode className="mr-2 h-4 w-4" />
            Verificar Recogida
          </Button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Órdenes Pendientes
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {metrics.totalPickPendingOrders}
              </div>
            )}
            <p className="text-xs text-muted-foreground">listas para recoger</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Actualizadas Hoy
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.todayUpdatedOrders}
              </div>
            )}
            <p className="text-xs text-muted-foreground">órdenes procesadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="stores" className="space-y-3">
        <TabsList>
          <TabsTrigger value="stores" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Tiendas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-3">
          {/* Stores Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Tiendas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton columns={7} rows={5} showActions={false} />
              ) : (
                <StoresDataTable
                  stores={tiendas}
                  onViewStore={(store) => {
                    setDetailStore(store);
                    setIsDetailOpen(true);
                  }}
                  onKioskAccount={(store) => {
                    setKioskDialogStore(store);
                    setIsKioskDialogOpen(true);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics de Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics de rendimiento por tienda - Próximamente
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Configuración global del sistema de tiendas físicas -
                Próximamente
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verification Modal */}
      <PickupVerificationModal
        open={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerificationSuccess={handleVerificationSuccess}
      />

      {/* Store Detail Dialog */}
      <StoreDetailDialog
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailStore(null);
        }}
        store={detailStore}
      />

      {/* Kiosk Account Dialog */}
      <KioskAccountDialog
        open={isKioskDialogOpen}
        onClose={() => {
          setIsKioskDialogOpen(false);
          setKioskDialogStore(null);
        }}
        store={kioskDialogStore}
      />
    </div>
  );
}
