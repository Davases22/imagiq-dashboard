interface PriceDisplayProps {
  currentPrice?: string
  currentOriginalPrice?: string
  isBundle?: boolean
  bundleDiscount?: number
}

export function PriceDisplay({
  currentPrice,
  currentOriginalPrice,
  isBundle,
  bundleDiscount,
}: PriceDisplayProps) {
  const formatPrice = (price: number) => `$ ${price.toLocaleString('es-CO')}`;
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{currentPrice}</span>
        {/* No mostrar precio tachado para bundles */}
        {!isBundle && currentOriginalPrice && (
          <span className="text-xl text-muted-foreground line-through">
            {currentOriginalPrice}
          </span>
        )}
      </div>
      {/* Mostrar descuento como monto monetario para bundles */}
      {isBundle && bundleDiscount && bundleDiscount > 0 && (
        <div className="text-sm text-muted-foreground">
          Con descuento: {formatPrice(bundleDiscount)}
        </div>
      )}
    </div>
  )
}
