"use client"

import { lazy, Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Bell, Package, Mail, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  productNotificationEndpoints, 
  GroupedNotificationsResponse,
  productEndpoints,
  ProductApiData
} from "@/lib/api"
import { toast } from "sonner"

const ProductsTableWrapper = lazy(() =>
  import("@/components/tables/products-table-wrapper").then(mod => ({
    default: mod.ProductsTableWrapper
  }))
)

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[200px]" />
      </div>
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[180px]" />
        <Skeleton className="h-8 w-[200px]" />
      </div>
    </div>
  )
}

export default function ProductosNotificacionesPage() {
  const router = useRouter()
  const [notificationsData, setNotificationsData] = useState<GroupedNotificationsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [productsWithNotifications, setProductsWithNotifications] = useState<string[]>([])
  // Quién ya volvió a tener existencias es justo lo que hay que mirar para
  // decidir a quién avisar: por eso el filtro vive aquí y no escondido en
  // el panel general de filtros.
  const [filtroStock, setFiltroStock] = useState<"todos" | "con" | "sin">("todos")

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true)
      try {
        const response = await productNotificationEndpoints.getGrouped()
        if (response.success && response.data) {
          setNotificationsData(response.data)
          
          // Extraer todos los SKUs que tienen notificaciones
          const skus: string[] = []
          response.data.notificaciones.forEach(group => {
            group.productos.forEach(producto => {
              skus.push(producto.sku)
            })
          })
          setProductsWithNotifications(skus)
        } else {
          // Manejar errores del backend
          const errorMessage = response.message || "Error al cargar las notificaciones desde el servidor"
          console.error("Error en la respuesta del servidor:", {
            success: response.success,
            message: response.message,
            errors: response.errors,
            endpoint: "/api/messaging/notifications/grouped",
          })
          toast.error(errorMessage)
          // Establecer datos vacíos para evitar errores en el render
          setNotificationsData({ total: 0, notificaciones: [] })
          setProductsWithNotifications([])
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
        toast.error("Error de conexión al cargar las notificaciones. Verifica que el servidor esté funcionando.")
        // Establecer datos vacíos para evitar errores en el render
        setNotificationsData({ total: 0, notificaciones: [] })
        setProductsWithNotifications([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  // `notificationsData.total` cuenta códigos de market, no productos: pintarlo
  // como "productos con solicitudes" daba 42 donde hay 49 SKUs. Lo que sí le
  // sirve a quien mira la pantalla es cuánta gente está esperando.
  const totalSolicitudes = notificationsData?.notificaciones.reduce((total, group) => {
    return total + group.productos.reduce((sum, prod) => sum + prod.totalNotificaciones, 0)
  }, 0) || 0

  const totalPendientes = notificationsData?.notificaciones.reduce((total, group) => {
    return total + group.productos.reduce((sum, prod) => sum + prod.notificacionesPendientes, 0)
  }, 0) || 0

  const totalEnviadas = notificationsData?.notificaciones.reduce((total, group) => {
    return total + group.productos.reduce((sum, prod) => sum + prod.notificacionesEnviadas, 0)
  }, 0) || 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/productos')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Productos que tus clientes desean</h1>
              <p className="text-muted-foreground">
                Notificaciones de productos solicitados por los clientes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de notificaciones */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes totales</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalSolicitudes}</div>
                <p className="text-xs text-muted-foreground">
                  Clientes esperando aviso
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por enviar</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-28" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">{totalPendientes}</div>
                <p className="text-xs text-muted-foreground">
                  Avisos sin mandar
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ya avisados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{totalEnviadas}</div>
                <p className="text-xs text-muted-foreground">
                  Correos enviados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Únicos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{productsWithNotifications.length}</div>
                <p className="text-xs text-muted-foreground">
                  SKUs con solicitudes
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de productos con notificaciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Productos Solicitados</CardTitle>
          <Select
            value={filtroStock}
            onValueChange={(v) => setFiltroStock(v as "todos" | "con" | "sin")}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="con">Solo con stock</SelectItem>
              <SelectItem value="sin">Solo agotados</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : productsWithNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
              <p className="text-muted-foreground">
                Las solicitudes de notificación aparecerán aquí
              </p>
            </div>
          ) : (
            <Suspense fallback={<TableSkeleton />}>
              <ProductsTableWrapper 
                filterBySku={productsWithNotifications}
                notificationsData={notificationsData}
                notificationsOnly={true}
                filtroStock={filtroStock}
              />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
