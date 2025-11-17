"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  LayoutGrid,
  Megaphone,
  ShoppingCart,
  Tag,
  Bell,
  Package,
  Sparkles,
  MapPin,
  CheckCircle2
} from "lucide-react"

type BannerPlacement =
  | "hero"
  | "home-2"
  | "home-3"
  | "home-4"
  | "subheader"
  | "category-top"
  | "product-grid"
  | "product-detail"
  | "cart"
  | "checkout"
  | "sticky-bottom"
  | "notification"

type BannerType = {
  id: BannerPlacement
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  placement: string
  bestFor: string[]
  hasSubcategories?: boolean
  subcategories?: Array<{
    id: string
    title: string
    description: string
  }>
  recommended?: boolean
}

const bannerTypes: BannerType[] = [
  {
    id: "hero",
    title: "Hero Banner",
    description: "Banner principal en la parte superior de la homepage. Ideal para promociones principales y mensajes de marca.",
    icon: LayoutGrid,
    placement: "Homepage - Superior",
    bestFor: ["Promociones principales", "Nuevos productos", "Mensaje de marca"],
  },
  {
    id: "home-2",
    title: "Banner Home 2",
    description: "Segundo banner en la homepage. Ideal para promociones secundarias o destacar categorías.",
    icon: Sparkles,
    placement: "Homepage - Sección 2",
    bestFor: ["Categorías destacadas", "Ofertas especiales", "Nuevas colecciones"],
  },
  {
    id: "home-3",
    title: "Banner Home 3",
    description: "Tercer banner en la homepage. Perfecto para mostrar beneficios o servicios adicionales.",
    icon: Tag,
    placement: "Homepage - Sección 3",
    bestFor: ["Beneficios del servicio", "Garantías", "Envío gratis"],
  },
  {
    id: "home-4",
    title: "Banner Home 4",
    description: "Cuarto banner en la homepage. Excelente para contenido complementario o llamadas a la acción finales.",
    icon: Bell,
    placement: "Homepage - Sección 4",
    bestFor: ["Newsletter", "Redes sociales", "App download"],
  },
  {
    id: "category-top",
    title: "Banner de Categoría",
    description: "Banner en la parte superior de páginas de categoría. Promociona productos específicos de esa categoría.",
    icon: ShoppingCart,
    placement: "Páginas de categoría - Superior",
    bestFor: ["Ofertas de categoría", "Productos destacados", "Filtros visuales"],
  },
  {
    id: "notification",
    title: "Banner Navbar Mobile",
    description: "Banner de notificación en el navbar para dispositivos móviles. Ideal para anuncios importantes.",
    icon: Bell,
    placement: "Navbar mobile - Superior",
    bestFor: ["Anuncios urgentes", "Promociones flash", "Avisos importantes"],
  },
  {
    id: "sticky-bottom",
    title: "Banner de Ofertas",
    description: "Banner fijo en la parte inferior. Perfecto para destacar ofertas y promociones persistentes.",
    icon: Megaphone,
    placement: "Inferior fijo - Todas las páginas",
    bestFor: ["Ofertas especiales", "Descuentos", "Promociones del día"],
  },
]

export default function SeleccionarTipoBannerPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<BannerPlacement | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)

  const handleContinue = () => {
    if (!selectedType) return

    // Construir query params
    const params = new URLSearchParams({
      type: selectedType,
    })

    if (selectedSubcategory) {
      params.append("subcategory", selectedSubcategory)
    }

    router.push(`/marketing/banners/crear?${params.toString()}`)
  }

  const selectedBannerType = bannerTypes.find(t => t.id === selectedType)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Crear Nuevo Banner</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona el tipo de banner para tu campaña
        </p>
      </div>

      {/* Seleccionar tipo de banner */}
      <Card>
        <CardHeader>
          <CardTitle>Selecciona el tipo de banner</CardTitle>
          <CardDescription>
            Elige dónde se mostrará tu banner en la página web
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {bannerTypes.map((type) => (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  selectedType === type.id ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => {
                  setSelectedType(type.id)
                  setSelectedSubcategory(null)
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <type.icon className={`h-5 w-5 ${selectedType === type.id ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <CardTitle className="text-base">{type.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {type.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{type.placement}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {type.bestFor.slice(0, 2).map((item) => (
                        <Badge key={item} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paso 3: Subcategorías (si aplica) */}
      {selectedBannerType?.hasSubcategories && selectedBannerType.subcategories && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 3: Selecciona la subcategoría</CardTitle>
            <CardDescription>
              Especifica dónde exactamente se mostrará el banner de {selectedBannerType.title.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {selectedBannerType.subcategories.map((subcat) => (
                <Card
                  key={subcat.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedSubcategory === subcat.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedSubcategory(subcat.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-sm">{subcat.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {subcat.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen y botón de continuar - Sticky */}
      {selectedType && (
        <div className="sticky bottom-0 z-10 pt-6 pb-6">
          <Card className="border-primary/50 bg-primary/5 shadow-2xl backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold">Resumen de configuración</h3>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>• Tipo: {selectedBannerType?.title}</p>
                    {selectedSubcategory && (
                      <p>• Subcategoría: {selectedBannerType?.subcategories?.find(s => s.id === selectedSubcategory)?.title}</p>
                    )}
                  </div>
                </div>
                <Button onClick={handleContinue} size="lg" className="shrink-0">
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
