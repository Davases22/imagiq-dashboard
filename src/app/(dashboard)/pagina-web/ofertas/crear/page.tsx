"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Tag, Eye } from "lucide-react"
import { toast } from "sonner"
import { OfertaBasicFields, OfertaBannersManager } from "@/components/ofertas"
import { BannerPreview } from "@/components/banners/preview/banner-preview"
import { BannerTextStyles, BannerPosition } from "@/types/banner"

const DEFAULT_TEXT_STYLES: BannerTextStyles = {
  title: { fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: "700", lineHeight: "1.2" },
  description: { fontSize: "clamp(1rem, 2vw, 1.5rem)", fontWeight: "400", lineHeight: "1.5" },
  cta: { fontSize: "1rem", fontWeight: "600", padding: "0.75rem 1.5rem", borderWidth: "0px" },
}

interface BannerData {
  id: string
  name: string
  placement: string
  link_url: string
  title: string
  description: string
  cta: string
  color_font: string
  coordinates: string
  coordinates_mobile: string
}

interface BannerFiles {
  desktop_image?: File
  desktop_video?: File
  mobile_image?: File
  mobile_video?: File
}

interface BannerItem {
  id: string
  data: BannerData
  files: BannerFiles
  textStyles: BannerTextStyles
  positionDesktop: BannerPosition
  positionMobile: BannerPosition
}

export default function CrearOfertaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Estados de oferta
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [descuento, setDescuento] = useState("")
  const [tipoDescuento, setTipoDescuento] = useState<"porcentaje" | "monto">("porcentaje")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Toggle de banners
  const [bannersEnabled, setBannersEnabled] = useState(false)

  // Estado de banners múltiples
  const [banners, setBanners] = useState<BannerItem[]>([
    {
      id: "banner-1",
      data: {
        id: "banner-1",
        name: "Banner 1",
        placement: "ofertas-nueva-oferta",
        link_url: "",
        title: "",
        description: "",
        cta: "",
        color_font: "#000000",
        coordinates: "",
        coordinates_mobile: "",
      },
      files: {},
      textStyles: DEFAULT_TEXT_STYLES,
      positionDesktop: { x: 10, y: 50 },
      positionMobile: { x: 10, y: 50 },
    },
  ])

  const [activeBannerId, setActiveBannerId] = useState("banner-1")

  const activeBanner = banners.find((b) => b.id === activeBannerId)

  const handleOfertaFieldChange = (field: string, value: string) => {
    switch (field) {
      case "titulo":
        setTitulo(value)
        // Generate placement from titulo: ofertas-{normalized-title}
        if (value.trim()) {
          const normalizedTitle = value.trim().toLowerCase().replace(/\s+/g, '-')
          const newPlacement = `ofertas-${normalizedTitle}`
          // Update all banners with new placement
          setBanners(prev => prev.map(b => ({
            ...b,
            data: { ...b.data, placement: newPlacement }
          })))
        }
        break
      case "descripcion":
        setDescripcion(value)
        break
      case "descuento":
        setDescuento(value)
        break
      case "tipoDescuento":
        setTipoDescuento(value as "porcentaje" | "monto")
        break
      case "fechaInicio":
        setFechaInicio(value)
        break
      case "fechaFin":
        setFechaFin(value)
        break
    }
  }

  const handleBannersChange = (updatedBanners: Array<{ id: string; data: BannerData; files: BannerFiles; textStyles: BannerTextStyles }>) => {
    // Generate current placement from titulo
    const normalizedTitle = titulo.trim() ? titulo.trim().toLowerCase().replace(/\s+/g, '-') : 'nueva-oferta'
    const currentPlacement = `ofertas-${normalizedTitle}`
    
    setBanners(prev =>
      updatedBanners.map(ub => {
        const existing = prev.find(p => p.id === ub.id)
        return existing
          ? { ...existing, ...ub, data: { ...ub.data, placement: currentPlacement } }
          : { ...ub, data: { ...ub.data, placement: currentPlacement }, positionDesktop: { x: 10, y: 50 }, positionMobile: { x: 10, y: 50 } }
      })
    )
  }

  const handlePositionDesktopChange = (position: BannerPosition) => {
    setBanners(prev =>
      prev.map(b => (b.id === activeBannerId ? { ...b, positionDesktop: position } : b))
    )
  }

  const handlePositionMobileChange = (position: BannerPosition) => {
    setBanners(prev =>
      prev.map(b => (b.id === activeBannerId ? { ...b, positionMobile: position } : b))
    )
  }

  const isFormValid = () => {
    if (!titulo.trim()) return false
    if (!descuento || parseFloat(descuento) <= 0) return false
    if (!fechaInicio || !fechaFin) return false
    if (new Date(fechaInicio) > new Date(fechaFin)) return false
    if (bannersEnabled && banners.some(b => !b.data.name.trim())) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid()) {
      toast.error("Por favor completa todos los campos requeridos correctamente")
      return
    }

    setSaving(true)
    try {
      // TODO: Implementar llamada a API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Oferta creada exitosamente")
      router.push("/pagina-web/ofertas")
    } catch (error) {
      console.error("Error creating oferta:", error)
      toast.error("Error al crear la oferta")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/pagina-web/ofertas")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Nueva Oferta</h1>
          <p className="text-muted-foreground">
            Crea una nueva oferta con banners promocionales
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulario - Columna Izquierda */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Oferta</CardTitle>
                <CardDescription>Detalles principales de la promoción</CardDescription>
              </CardHeader>
              <CardContent>
                <OfertaBasicFields
                  titulo={titulo}
                  descripcion={descripcion}
                  descuento={descuento}
                  tipoDescuento={tipoDescuento}
                  fechaInicio={fechaInicio}
                  fechaFin={fechaFin}
                  onFieldChange={handleOfertaFieldChange}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Banners Promocionales</CardTitle>
                <CardDescription>
                  Activa y configura banners en carrusel para esta oferta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="bannersEnabled">Activar Banners</Label>
                    <p className="text-xs text-muted-foreground">
                      Crea banners personalizados en carrusel
                    </p>
                  </div>
                  <Switch
                    id="bannersEnabled"
                    checked={bannersEnabled}
                    onCheckedChange={setBannersEnabled}
                  />
                </div>

                {bannersEnabled && (
                  <>
                    <Separator />
                    <OfertaBannersManager
                      banners={banners}
                      onBannersChange={handleBannersChange}
                      onActiveBannerChange={setActiveBannerId}
                      activeBannerId={activeBannerId}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Oferta Activa</Label>
                    <p className="text-xs text-muted-foreground">
                      Activar o desactivar la oferta
                    </p>
                  </div>
                  <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={!isFormValid() || saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Crear Oferta"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/pagina-web/ofertas")}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </div>

          {/* Preview - Columna Derecha (Sticky) */}
          <div className="lg:sticky lg:top-4 lg:self-start space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Descuento</p>
                  <p className="font-medium">
                    {descuento
                      ? tipoDescuento === "porcentaje"
                        ? `${descuento}%`
                        : `$${descuento}`
                      : "-"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="font-medium text-sm">
                    {fechaInicio && fechaFin
                      ? `${new Date(fechaInicio).toLocaleDateString("es-ES")} - ${new Date(fechaFin).toLocaleDateString("es-ES")}`
                      : "-"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Banners</p>
                  <p className="font-medium">
                    {bannersEnabled ? `${banners.length} banner${banners.length > 1 ? "s" : ""}` : "Desactivados"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {bannersEnabled && activeBanner && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Vista Previa
                  </CardTitle>
                  <CardDescription>
                    Arrastra los textos para posicionarlos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BannerPreview
                    desktop_image={activeBanner.files.desktop_image}
                    desktop_video={activeBanner.files.desktop_video}
                    mobile_image={activeBanner.files.mobile_image}
                    mobile_video={activeBanner.files.mobile_video}
                    title={activeBanner.data.title}
                    description={activeBanner.data.description}
                    cta={activeBanner.data.cta}
                    color_font={activeBanner.data.color_font}
                    link_url={activeBanner.data.link_url}
                    placement={activeBanner.data.placement}
                    position_desktop={activeBanner.positionDesktop}
                    position_mobile={activeBanner.positionMobile}
                    onPositionDesktopChange={handlePositionDesktopChange}
                    onPositionMobileChange={handlePositionMobileChange}
                    text_styles={activeBanner.textStyles}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
