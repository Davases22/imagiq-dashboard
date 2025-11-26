/**
 * Componente selector de productos para secciones de ofertas
 * Permite buscar y seleccionar múltiples productos
 */

"use client"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, X, Loader2, Package, AlertCircle } from "lucide-react"
import { useSectionProducts } from "@/hooks/use-section-products"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProductSection {
  id: string
  name: string
  type: "categoria" | "menu" | "submenu"
  categoryId?: string
  menuId?: string
  submenuId?: string
  products: string[]
}

interface ProductSelectorProps {
  section: ProductSection
  onProductsChange: (productIds: string[]) => void
}

export function ProductSelector({ section, onProductsChange }: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { products, loading, error, canLoadProducts, searchProducts } = useSectionProducts(section)

  // Buscar en backend con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, searchProducts])

  const filteredProducts = products

  // Manejar selección/deselección de producto
  const handleToggleProduct = (productId: string) => {
    const isSelected = section.products.includes(productId)
    const newProducts = isSelected
      ? section.products.filter((id) => id !== productId)
      : [...section.products, productId]
    
    onProductsChange(newProducts)
  }

  // Remover producto seleccionado
  const handleRemoveProduct = (productId: string) => {
    onProductsChange(section.products.filter((id) => id !== productId))
  }

  // Obtener información de productos seleccionados
  const selectedProductsInfo = useMemo(() => {
    return section.products
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean)
  }, [section.products, products])

  // Si no se puede cargar productos
  if (!canLoadProducts) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Selecciona una {section.type === "categoria" ? "categoría" : section.type === "menu" ? "menú" : "submenú"} para ver productos disponibles
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="space-y-2">
        <Label htmlFor="productSearch">Buscar Productos</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="productSearch"
            placeholder="Buscar por nombre, SKU o marca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Cargando productos...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de productos disponibles */}
      {!loading && !error && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Productos Disponibles</Label>
              <Badge variant="secondary">
                {filteredProducts.length} de {products.length}
              </Badge>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
                <Package className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No se encontraron productos" : "No hay productos disponibles"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] border rounded-lg p-2">
                <div className="space-y-1">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={section.products.includes(product.id)}
                        onCheckedChange={() => handleToggleProduct(product.id)}
                      />
                      <label
                        htmlFor={`product-${product.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm leading-tight">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {product.sku && (
                                <span className="text-xs text-muted-foreground">
                                  SKU: {product.sku}
                                </span>
                              )}
                              {product.brand && (
                                <Badge variant="outline" className="text-xs">
                                  {product.brand}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm whitespace-nowrap">
                              {product.price}
                            </p>
                            {product.stock !== undefined && (
                              <p className="text-xs text-muted-foreground">
                                Stock: {product.stock}
                              </p>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Productos seleccionados */}
          {section.products.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Productos Seleccionados</Label>
                  <Badge>{section.products.length}</Badge>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
                  {selectedProductsInfo.map((product) => (
                    <div
                      key={product?.id}
                      className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {product?.name}
                        </p>
                        {product?.sku && (
                          <p className="text-xs text-muted-foreground">
                            SKU: {product.sku}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProduct(product!.id)}
                        className="h-7 w-7 p-0 shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
