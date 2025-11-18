"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { StoreStatsCards } from "@/components/physical-stores/store-stats-cards";
import { StoresDataTable } from "@/components/physical-stores/stores-data-table";
import { PickupVerificationModal } from "@/components/physical-stores/pickup-verification-modal";
import { OrdersManagementModal } from "@/components/physical-stores/orders-management-modal";
import {
  mockPhysicalStores,
  mockStoreStats,
  getStoreStats
} from "@/lib/mock-data/physical-stores";
import {
  VerificationCodeService
} from "@/services/physical-stores/verification-code.service";
import {
  SecureCodeGenerator,
  CodeValidator
} from "@/services/physical-stores/code-generator.service";
import {
  MockVerificationCodeRepository,
  MockPickupOrderRepository,
  MockNotificationSender,
  MockInventoryService,
  MockLogger,
  MockAuditService
} from "@/services/physical-stores/mock-repositories";
import {
  PhysicalStore,
  PickupOrder,
  OrderStatus,
  PickupVerificationResult
} from "@/types/physical-stores";
import {
  Store,
  Package,
  QrCode,
  MapPin,
  Users,
  BarChart3,
  Settings,
  Plus,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { tiendasEndpoints, BackendTienda } from "@/lib/api";

export default function PuntoFisicoPage() {
  const [stores] = useState<PhysicalStore[]>(mockPhysicalStores);
  const [selectedStore, setSelectedStore] = useState<PhysicalStore | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<PickupOrder[]>([]);

  // Initialize services with dependency injection
  const [tiendas, setTiendas] = useState<BackendTienda[]>([]);
  const codeGenerator = new SecureCodeGenerator();
  const codeValidator = new CodeValidator();
  const verificationRepository = new MockVerificationCodeRepository();
  const orderRepository = new MockPickupOrderRepository();
  const notificationSender = new MockNotificationSender();
  const inventoryService = new MockInventoryService();
  const logger = new MockLogger();
  const auditService = new MockAuditService();

  const verificationService = new VerificationCodeService(
    codeGenerator,
    codeValidator,
    verificationRepository,
    orderRepository,
    logger,
    auditService
  );

  const activeStores = stores.filter(store => store.status === 'active');
  const inactiveStores = stores.filter(store => store.status !== 'active');
  const totalOrders = Object.values(mockStoreStats).reduce((sum, stats) => sum + stats.readyOrders, 0);
  const totalCompletedToday = Object.values(mockStoreStats).reduce((sum, stats) => sum + stats.completedToday, 0);

  const filteredStores = stores.filter(store =>
    store.location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
    // Cargar tiendas al montar el componente
    useEffect(() => {
      const loadTiendas = async () => {
        try {
          const response = await tiendasEndpoints.getAll();
      
  
          if (response.success && response.data) {
            // La API devuelve directamente un array
            const backendTiendas = Array.isArray(response.data) ? response.data : [];
            console.log(backendTiendas)
            setTiendas(backendTiendas);
  
           
          } else {
            
            toast.error("Error al cargar usuarios");

          }
        } catch (error) {
         
          toast.error("Error al cargar tiendas");
          // Usar datos mock si falla
        
        } finally {
          
        }
      };
  
      loadTiendas();
    }, []);


  const handleViewStore = (store: PhysicalStore) => {
    setSelectedStore(store);
    // In a real app, this would fetch store details
    toast.info(`Viendo detalles de ${store.location.name}`);
  };

  const handleManageOrders = async (store: PhysicalStore) => {
    setSelectedStore(store);

    // Mock orders data for the selected store
    const storeOrders = await orderRepository.findByStoreId(store.id);
    setOrders(storeOrders);
    setIsOrdersModalOpen(true);
  };

  const handleStoreSettings = (store: PhysicalStore) => {
    setSelectedStore(store);
    // In a real app, this would open store settings modal
    toast.info(`Configuración de ${store.location.name}`);
  };

  const handleVerifyPickup = () => {
    if (!selectedStore) {
      toast.error("Seleccione una tienda primero");
      return;
    }
    setIsVerificationModalOpen(true);
  };

  const handleVerificationSubmit = async (data: any): Promise<PickupVerificationResult> => {
    if (!selectedStore) {
      throw new Error("No store selected");
    }

    // Find the order first
    const order = await orderRepository.findByOrderNumber(data.orderNumber);
    if (!order) {
      return {
        success: false,
        message: "Número de orden no encontrado",
        timestamp: new Date(),
        verifiedBy: "Sistema"
      };
    }

    // Verify the pickup using the service
    return await verificationService.verifyPickupCode({
      orderId: order.id,
      verificationCode: data.verificationCode,
      storeId: selectedStore.id,
      verifiedBy: "Empleado de tienda",
      customerPresent: data.customerPresent,
      idVerified: data.idVerified,
      notes: data.notes
    });
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await orderRepository.updateStatus(orderId, status);

    // Refresh orders
    if (selectedStore) {
      const updatedOrders = await orderRepository.findByStoreId(selectedStore.id);
      setOrders(updatedOrders);
    }

    toast.success("Estado de orden actualizado");
  };

  const handleRefreshOrders = async () => {
    if (selectedStore) {
      const updatedOrders = await orderRepository.findByStoreId(selectedStore.id);
      setOrders(updatedOrders);
      toast.success("Órdenes actualizadas");
    }
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
            onClick={() => {
              if (activeStores.length > 0) {
                setSelectedStore(activeStores[0]);
                handleVerifyPickup();
              } else {
                toast.error("No hay tiendas activas disponibles");
              }
            }}
          >
            <QrCode className="mr-2 h-4 w-4" />
            Verificar Recogida
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tienda
          </Button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiendas Activas</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activeStores.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {inactiveStores.length} inactivas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {totalOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              listas para recoger
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas Hoy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalCompletedToday}
            </div>
            <p className="text-xs text-muted-foreground">
              entregas exitosas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfacción Promedio</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {(Object.values(mockStoreStats).reduce((sum, stats) => sum + stats.customerSatisfaction, 0) / Object.values(mockStoreStats).length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              de 5.0 estrellas
            </p>
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
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tiendas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Store Details for Selected Store */}
          {selectedStore && (
            <StoreStatsCards
              stats={getStoreStats(selectedStore.id)}
              storeName={selectedStore.location.name}
            />
          )}

          {/* Stores Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Tiendas</CardTitle>
            </CardHeader>
            <CardContent>
              <StoresDataTable
                stores={tiendas}
                onViewStore={(store) => toast.info(`Viendo detalles de ${store.descripcion}`)}
                onManageOrders={(store) => toast.info(`Gestionar órdenes de ${store.descripcion}`)}
                onStoreSettings={(store) => toast.info(`Configuración de ${store.descripcion}`)}
              />
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
                Configuración global del sistema de tiendas físicas - Próximamente
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verification Modal */}
      {selectedStore && (
        <PickupVerificationModal
          open={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          store={selectedStore}
          onVerify={handleVerificationSubmit}
        />
      )}

      {/* Orders Management Modal */}
      {selectedStore && (
        <OrdersManagementModal
          open={isOrdersModalOpen}
          onClose={() => setIsOrdersModalOpen(false)}
          store={selectedStore}
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onRefreshOrders={handleRefreshOrders}
        />
      )}
    </div>
  );
}