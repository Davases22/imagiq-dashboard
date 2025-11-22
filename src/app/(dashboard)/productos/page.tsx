"use client"

import { lazy, Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, DollarSign, AlertTriangle, Heart } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { productEndpoints, ProductSummaryV2, categoryEndpoints } from "@/lib/api"
import { BackendCategoryV2 } from "@/types"

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

type ViewMode = 'bundles' | 'products'

export default function ProductosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [summary, setSummary] = useState<ProductSummaryV2 | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [menusCount, setMenusCount] = useState(0)
  
  // Obtener viewMode de los query params, o usar 'products' por defecto
  const viewModeParam = searchParams.get('viewMode') as ViewMode | null
  const initialViewMode: ViewMode = (viewModeParam === 'bundles' || viewModeParam === 'products') ? viewModeParam : 'products'
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  
  // Actualizar viewMode cuando cambien los query params
  useEffect(() => {
    const newViewMode = searchParams.get('viewMode') as ViewMode | null
    if (newViewMode === 'bundles' || newViewMode === 'products') {
      setViewMode(newViewMode)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true)
      try {
        // Usar solo V1 (como estaba en main)
        const response = await productEndpoints.getSummary()
        if (response.success && response.data) {
          // Convertir V1 a V2 para mantener compatibilidad con la UI
          const v1Data = response.data
          
          // Obtener total de bundles desde V2
          let bundlesTotal: number | undefined = undefined
          try {
            const bundlesResponse = await productEndpoints.getFilteredSearchV2({
              page: 1,
              limit: 1, // Solo necesitamos el totalItems, no los productos
              productType: 'bundles'
            })
            if (bundlesResponse.success && bundlesResponse.data) {
              const bundlesResult = bundlesResponse.data.data || bundlesResponse.data
              if (bundlesResult && bundlesResult.totalItems !== undefined) {
                bundlesTotal = bundlesResult.totalItems
              }
            }
          } catch (bundlesError) {
            console.warn("Error fetching bundles total:", bundlesError)
            // Si falla, dejar undefined (vacío)
          }
          
          setSummary({
            productsTotal: v1Data.productsTotal ?? 0,
            bundlesTotal: bundlesTotal ?? 0, // Total de bundles desde V2, usar 0 si es undefined
            totalValue: v1Data.totalValue ?? 0,
            lowStock: v1Data.lowStock ?? 0,
            bundlesActive: bundlesTotal ?? 0 // Usar el total de bundles como activos (o 0 si es undefined)
          })
        } else {
          // Si V1 falla, dejar todo vacío (no poner 0)
          setSummary(null)
        }
      } catch (error) {
        console.error("Error fetching summary:", error)
        // Si hay error, dejar vacío (no poner 0)
        setSummary(null)
      } finally {
        setIsLoading(false)
      }
    }

    const fetchMenusCount = async () => {
      try {
        // Usar el endpoint V2 que incluye información de bundles
        const response = await categoryEndpoints.getVisibleCompletasV2()
        if (response.success && response.data) {
          const categorias = response.data as BackendCategoryV2[]
          const totalMenus = categorias.reduce((total, category) => {
            return total + category.menus.filter(menu => menu.nombre).length
          }, 0)
          setMenusCount(totalMenus)
        }
      } catch (error) {
        console.error("Error fetching menus count:", error)
        // Fallback a V1 si V2 falla
        try {
          const fallbackResponse = await categoryEndpoints.getVisibleCompletas()
          if (fallbackResponse.success && fallbackResponse.data) {
            const totalMenus = fallbackResponse.data.reduce((total, category) => {
              return total + category.menus.filter(menu => menu.nombre).length
            }, 0)
            setMenusCount(totalMenus)
          }
        } catch (fallbackError) {
          console.error("Error en fallback:", fallbackError)
        }
      }
    }

    fetchSummary()
    fetchMenusCount()
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Gestiona tu inventario de productos
          </p>
        </div>
        <Button 
          className="gap-2"
          onClick={() => router.push('/productos/notificaciones')}
        >
          <Heart className="h-4 w-4" />
          Productos que tus clientes desean
        </Button>
      </div>

      {/* Métricas de productos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.productsTotal ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {summary?.productsTotal ?? 0} únicos
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bundles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {summary?.bundlesTotal !== undefined ? summary.bundlesTotal : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary?.bundlesTotal !== undefined ? `${summary.bundlesTotal} bundles` : 'Bundles activos'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-28" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${(summary?.totalValue ?? 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor del inventario
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-36" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.lowStock ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Productos con stock ≤ 10
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menús</CardTitle>
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
                <div className="text-2xl font-bold">{menusCount}</div>
                <p className="text-xs text-muted-foreground">
                  Menús disponibles
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Productos</CardTitle>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="bundles">Bundles</TabsTrigger>
                <TabsTrigger value="products">Productos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TableSkeleton />}>
            <ProductsTableWrapper viewMode={viewMode} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}