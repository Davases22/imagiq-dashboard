"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save } from "lucide-react"
import {
  OfertaBasicFields,
  OfertaBannersManager,
  OfertaSummaryCard,
  OfertaBannerPreviewCard,
  OfertaSectionsManager,
  OfertaInfoSection,
  OfertaFaqSection,
  OfertaContentSummary,
} from "@/components/ofertas"
import { useOfertaForm } from "@/hooks/use-oferta-form"

/**
 * Página de creación de nueva Landing Page dinámica
 *
 * Reutiliza el formulario completo de ofertas que ya soporta:
 * - Información básica (título, descripción, fechas)
 * - Banners promocionales con carrusel
 * - Secciones de productos organizadas
 * - Sección informativa con links
 * - FAQs
 * - Posicionamiento de elementos
 */
export default function CrearLandingPagePage() {
  const {
    titulo,
    descripcion,
    fechaInicio,
    fechaFin,
    isActive,
    setIsActive,
    bannersEnabled,
    setBannersEnabled,
    banners,
    activeBannerId,
    setActiveBannerId,
    activeBanner,
    productSections,
    setProductSections,
    infoSectionEnabled,
    setInfoSectionEnabled,
    infoItems,
    setInfoItems,
    faqEnabled,
    setFaqEnabled,
    faqItems,
    setFaqItems,
    handleOfertaFieldChange,
    handleBannersChange,
    handlePositionDesktopChange,
    handlePositionMobileChange,
    handleSubmit,
    handleCancel,
    saving,
    isFormValid,
  } = useOfertaForm({ returnPath: "/pagina-web/landing-pages" })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Nueva Landing Page</h1>
          <p className="text-muted-foreground">
            Crea una nueva página dinámica con banners, productos, FAQs y más
          </p>
        </div>
      </div>

      {/* Formulario completo */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Columna Izquierda - Formulario */}
          <div className="space-y-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información de la Página</CardTitle>
                <CardDescription>Detalles principales de la landing page</CardDescription>
              </CardHeader>
              <CardContent>
                <OfertaBasicFields
                  titulo={titulo}
                  descripcion={descripcion}
                  fechaInicio={fechaInicio}
                  fechaFin={fechaFin}
                  onFieldChange={handleOfertaFieldChange}
                />
              </CardContent>
            </Card>

            {/* Banners */}
            <Card>
              <CardHeader>
                <CardTitle>Banners Promocionales</CardTitle>
                <CardDescription>
                  Activa y configura banners en carrusel para esta página
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

            {/* Secciones de Productos */}
            <Card>
              <CardHeader>
                <CardTitle>Secciones de Productos</CardTitle>
                <CardDescription>
                  Organiza productos por categorías, menús o submenús
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OfertaSectionsManager
                  sections={productSections}
                  onSectionsChange={setProductSections}
                />
              </CardContent>
            </Card>

            {/* Sección Informativa */}
            <OfertaInfoSection
              enabled={infoSectionEnabled}
              items={infoItems}
              onEnabledChange={setInfoSectionEnabled}
              onItemsChange={setInfoItems}
            />

            {/* FAQs */}
            <OfertaFaqSection
              enabled={faqEnabled}
              items={faqItems}
              onEnabledChange={setFaqEnabled}
              onItemsChange={setFaqItems}
            />

            {/* Estado */}
            <Card>
              <CardHeader>
                <CardTitle>Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Página Activa</Label>
                    <p className="text-xs text-muted-foreground">
                      Activar o desactivar la página
                    </p>
                  </div>
                  <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={!isFormValid || saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Crear Página"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </div>

          {/* Columna Derecha - Preview (Sticky) */}
          <div className="lg:sticky lg:top-4 lg:self-start space-y-6">
            {/* Resumen de la página */}
            <OfertaSummaryCard
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              bannersEnabled={bannersEnabled}
              bannersCount={banners.length}
            />

            {/* Resumen de contenido */}
            <OfertaContentSummary
              bannersCount={banners.length}
              sectionsCount={productSections.length}
              infoItemsCount={infoItems.length}
              faqItemsCount={faqItems.length}
              infoEnabled={infoSectionEnabled}
              faqEnabled={faqEnabled}
            />

            {/* Preview del banner activo */}
            {bannersEnabled && activeBanner && (
              <OfertaBannerPreviewCard
                activeBanner={activeBanner}
                onPositionDesktopChange={handlePositionDesktopChange}
                onPositionMobileChange={handlePositionMobileChange}
              />
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
