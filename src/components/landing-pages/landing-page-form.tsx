"use client"

import { memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Save, Loader2 } from "lucide-react"
import {
  OfertaBasicFields,
  OfertaBannersManager,
  OfertaSectionsManager,
  OfertaFaqSection,
} from "@/components/ofertas"
import { useOfertaForm } from "@/hooks/use-oferta-form"
import { Skeleton } from "@/components/ui/skeleton"
import { BannerPreview } from "@/components/banners/preview/banner-preview"

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
    faqEnabled,
    setFaqEnabled,
    faqItems,
    setFaqItems,
    handleOfertaFieldChange,
    handleBannersChange,
    handleSubmit,
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
        <div className="lg:sticky lg:top-20 lg:self-start space-y-6">
          {activeBanner && (
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa del Banner</CardTitle>
                <CardDescription>
                  Vista previa en tiempo real con drag & drop de bloques de contenido
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <div className="w-full overflow-x-auto">
                  <BannerPreview
                    bannerId={activeBanner.id}
                    desktop_image={activeBanner.files.desktop_image || activeBanner.data.desktop_image_url}
                    desktop_video={activeBanner.files.desktop_video || activeBanner.data.desktop_video_url}
                    mobile_image={activeBanner.files.mobile_image || activeBanner.data.mobile_image_url}
                    mobile_video={activeBanner.files.mobile_video || activeBanner.data.mobile_video_url}
                    link_url={activeBanner.data.link_url}
                    placement="ofertas"
                    isLandingPage={true}
                    content_blocks={activeBanner.contentBlocks}
                    onBlockPositionChange={(blockId, device, position) => {
                      const updatedBanners = banners.map(b => {
                        if (b.id === activeBannerId) {
                          const updatedBlocks = b.contentBlocks.map(block => {
                            if (block.id === blockId) {
                              return {
                                ...block,
                                [device === 'desktop' ? 'position_desktop' : 'position_mobile']: position
                              };
                            }
                            return block;
                          });
                          return { ...b, contentBlocks: updatedBlocks };
                        }
                        return b;
                      });
                      handleBannersChange(updatedBanners);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  )
}

// Exportar con memo para evitar re-renders innecesarios
export const LandingPageForm = memo(LandingPageFormComponent)
