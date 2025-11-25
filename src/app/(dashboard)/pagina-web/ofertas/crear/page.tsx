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

export default function CrearOfertaPage() {
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
  } = useOfertaForm()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleCancel}>
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

            <OfertaInfoSection
              enabled={infoSectionEnabled}
              items={infoItems}
              onEnabledChange={setInfoSectionEnabled}
              onItemsChange={setInfoItems}
            />

            <OfertaFaqSection
              enabled={faqEnabled}
              items={faqItems}
              onEnabledChange={setFaqEnabled}
              onItemsChange={setFaqItems}
            />

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
              <Button type="submit" className="flex-1" disabled={!isFormValid || saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Crear Oferta"}
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

          {/* Preview - Columna Derecha (Sticky) */}
          <div className="lg:sticky lg:top-4 lg:self-start space-y-6">
            <OfertaSummaryCard
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              bannersEnabled={bannersEnabled}
              bannersCount={banners.length}
            />

            <OfertaContentSummary
              bannersCount={banners.length}
              sectionsCount={productSections.length}
              infoItemsCount={infoItems.length}
              faqItemsCount={faqItems.length}
              infoEnabled={infoSectionEnabled}
              faqEnabled={faqEnabled}
            />

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

