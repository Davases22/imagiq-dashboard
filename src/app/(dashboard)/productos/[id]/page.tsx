"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useProduct } from "@/features/products/useProducts"
import { ProductColor } from "@/features/products/useProducts"
import { ProductMultimedia } from "./components/ProductMultimedia"
import { ProductInfo } from "./components/ProductInfo"
import { ProductDescription } from "./components/ProductDescription"
import { StoreStockDisplay } from "./components/StoreStockDisplay"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const { product, loading, error } = useProduct(productId)
  console.log("ProductDetailPage render", { product})
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null)

  /**
   * Helper function para encontrar la mejor variante a mostrar inicialmente
   * Prioriza: mayor stock > menor precio > características más comunes
   */
  const findBestVariantToDisplay = (variants: ProductColor[]): ProductColor | null => {
    if (variants.length === 0) return null;
    if (variants.length === 1) return variants[0];

    // Ordenar por stock (mayor a menor)
    const sortedByStock = [...variants].sort((a, b) =>
      (b.stockTotal || 0) - (a.stockTotal || 0)
    );

    // Tomar top 30% o al menos 3 variantes con mejor stock
    const topStockCount = Math.max(3, Math.ceil(sortedByStock.length * 0.3));
    const topStockVariants = sortedByStock.slice(0, topStockCount);

    // Ordenar por precio (menor primero)
    const sortedByPrice = [...topStockVariants].sort((a, b) => {
      const priceA = a.price ? parseFloat(a.price.replace(/[^0-9.-]+/g, "")) : 0;
      const priceB = b.price ? parseFloat(b.price.replace(/[^0-9.-]+/g, "")) : 0;
      return priceA - priceB;
    });

    return sortedByPrice[0];
  };

  // Resetear selectedColor cuando cambia el producto (para evitar que persista entre productos diferentes)
  useEffect(() => {
    setSelectedColor(null);
  }, [productId]);

  // Establecer la mejor variante como seleccionada por defecto (solo para productos normales con colores)
  useEffect(() => {
    // Detectar si es un bundle: usar el campo isBundle (no verificar por startsWith 'F')
    const isBundle = product?.isBundle === true;
    
    // Si es un bundle, mantener selectedColor como null (los bundles no tienen variantes de color)
    if (isBundle) {
      setSelectedColor(null);
      return;
    }
    
    // Para productos normales, establecer la mejor variante si hay colores disponibles
    if (product && product.colors.length > 0 && !selectedColor) {
      const bestVariant = findBestVariantToDisplay(product.colors);
      if (bestVariant) {
        setSelectedColor(bestVariant);
        console.log("Setting best variant as default", { bestVariant });
      }
    }
  }, [product, productId, selectedColor])


  if (loading) {
    return <ProductDetailSkeleton />
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Producto no encontrado</h2>
        <p className="text-muted-foreground">{error || "No se pudo cargar el producto"}</p>
        <Button onClick={() => {
          // En caso de error, siempre volver a 'products' por defecto
          router.push("/productos?viewMode=products");
        }}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a productos
        </Button>
      </div>
    )
  }

  // Detectar si es un bundle: usar el campo isBundle (no verificar por startsWith 'F')
  const isBundle = product.isBundle === true
  
  const currentPrice = selectedColor?.price || product.price
  const currentOriginalPrice = selectedColor?.originalPrice || product.originalPrice
  const currentDiscount = selectedColor?.discount || product.discount
  const currentStock = selectedColor?.stockTotal ?? product.stock ?? 0
  const currentStockEcommerce = selectedColor?.stock ?? 0
  const currentStockTiendas = selectedColor?.stockTiendas || {}
  const currentImage = selectedColor?.imageUrl || product.image
  const bundleDiscount = product.bundleDiscount // Monto monetario del descuento
  console.log(selectedColor)

  return (
    <div className="space-y-6">
      {/* Botón de regreso */}
      <Button
        variant="ghost"
        onClick={() => {
          // Si es un bundle, navegar con viewMode=bundles; si es producto normal, viewMode=products
          const viewMode = isBundle ? 'bundles' : 'products';
          router.push(`/productos?viewMode=${viewMode}`);
        }}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a productos
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Componente Multimedia */}
        <ProductMultimedia
          product={product}
          selectedColor={selectedColor}
          currentImage={currentImage}
          currentDiscount={currentDiscount}
          currentStock={currentStock}
        />

        {/* Componente de Información */}
        <div className="space-y-6">
          <ProductInfo
            product={product}
            selectedColor={selectedColor}
            currentPrice={currentPrice}
            currentStockEcommerce={currentStockEcommerce}
            currentOriginalPrice={currentOriginalPrice}
            currentStock={currentStock}
            currentStockTiendas={currentStockTiendas}
            onColorSelect={setSelectedColor}
            isBundle={isBundle}
            bundleDiscount={bundleDiscount}
          />

          {/* Componente de Descripción */}
          <ProductDescription
            product={product}
            selectedColor={selectedColor}
          />
        </div>
      </div>

      {/* Componente de Stock por Tienda */}
      <StoreStockDisplay stockTiendas={currentStockTiendas} />
    </div>
  )
}

// Skeleton de carga
function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-40" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div>
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
          </div>

          <Skeleton className="h-12 w-40" />

          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-12" />
            <Skeleton className="h-12 w-12" />
          </div>
        </div>
      </div>
    </div>
  )
}
