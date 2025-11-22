"use client"

import { ProductCardProps, ProductColor } from "@/features/products/useProducts"
import { useVariantSelection } from "../hooks/useVariantSelection"
import { ColorSelector } from "./ColorSelector"
import { CapacitySelector } from "./CapacitySelector"
import { RamSelector } from "./RamSelector"
import { PriceDisplay } from "./PriceDisplay"
import { ProductSpecifications } from "./ProductSpecifications"

interface ProductInfoProps {
  product: ProductCardProps
  selectedColor: ProductColor | null
  currentPrice?: string
  currentOriginalPrice?: string
  currentStock: number
  currentStockEcommerce: number
  currentStockTiendas: Record<string, number>
  onColorSelect: (color: ProductColor) => void
  isBundle?: boolean
  bundleDiscount?: number
}

export function ProductInfo({
  product,
  selectedColor,
  currentPrice,
  currentOriginalPrice,
  currentStock,
  currentStockEcommerce,
  currentStockTiendas,
  onColorSelect,
  isBundle,
  bundleDiscount,
}: ProductInfoProps) {
  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600'
    if (stock <= 5) return 'text-yellow-600'
    return 'text-green-600'
  }

  const {
    getUniqueColors,
    getCapacityOptions,
    getRamOptions,
    handleColorChange,
    handleCapacityChange,
    handleRamChange,
  } = useVariantSelection(product, selectedColor, onColorSelect)

  return (
    <div className="space-y-6">
      {/* Título y descripción */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
        {selectedColor?.description ? (
          <p className="mt-2 text-muted-foreground">{selectedColor.description}</p>
        ) : product.description ? (
          <p className="mt-2 text-muted-foreground">{product.description}</p>
        ) : null}
      </div>

      {/* Precio */}
      <PriceDisplay
        currentPrice={currentPrice}
        currentOriginalPrice={currentOriginalPrice}
        isBundle={isBundle}
        bundleDiscount={bundleDiscount}
      />

      {/* Selectores de variantes */}
      {product.colors.length > 0 && (
        <div className="space-y-4">
          <ColorSelector
            colors={getUniqueColors()}
            selectedColor={selectedColor}
            onColorChange={handleColorChange}
            getStockColor={getStockColor}
          />

          <CapacitySelector
            capacities={getCapacityOptions()}
            selectedCapacity={selectedColor?.capacity}
            onCapacityChange={handleCapacityChange}
          />

          <RamSelector
            rams={getRamOptions()}
            selectedRam={selectedColor?.ram}
            onRamChange={handleRamChange}
          />
        </div>
      )}

      {/* Información adicional */}
      <ProductSpecifications
        product={product}
        selectedColor={selectedColor}
        currentStock={currentStock}
        getStockColor={getStockColor}
      />
    </div>
  )
}
