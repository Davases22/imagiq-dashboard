"use client"

import { memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"

interface LandingPageFormProps {
  pageId?: string
  mode: "create" | "edit"
  onCancel: () => void
}

/**
 * Formulario unificado para crear/editar Landing Pages
 * 
 * Reutiliza toda la lógica del hook useOfertaForm y presenta
 * el mismo formulario en ambos modos.
 */
function LandingPageFormComponent({ pageId, mode, onCancel }: LandingPageFormProps) {
  const {
    loading,
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
    productSectionsTitle,
    setProductSectionsTitle,
    productSectionsDescription,
    setProductSectionsDescription,
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
  } = useOfertaForm({ 
    pageId,
    returnPath: "/pagina-web/landing-pages" 
  })

  const isEditMode = mode === "edit"
  const submitButtonText = isEditMode ? "Actualizar Página" : "Crear Página"

  // Loading skeleton mientras se cargan los datos (solo en modo edición)
  if (loading && isEditMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[500px]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </div>
    )
  }

  return (
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
                title={productSectionsTitle}
                description={productSectionsDescription}
                onTitleChange={setProductSectionsTitle}
                onDescriptionChange={setProductSectionsDescription}
                sections={productSections}
                onSectionsChange={setProductSections}
              />
            </CardContent>
          </Card>

          {/* Sección Informativa - TEMPORALMENTE DESHABILITADA */}
          {/* <OfertaInfoSection
            enabled={infoSectionEnabled}
            items={infoItems}
            onEnabledChange={setInfoSectionEnabled}
            onItemsChange={setInfoItems}
          /> */}

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
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {submitButtonText}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
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
  )
}

// Exportar con memo para evitar re-renders innecesarios
export const LandingPageForm = memo(LandingPageFormComponent)
