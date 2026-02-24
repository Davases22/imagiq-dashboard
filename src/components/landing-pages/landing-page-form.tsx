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
  OfertaLivestreamConfig,
} from "@/components/ofertas"
import { useOfertaForm } from "@/hooks/use-oferta-form"
import { Skeleton } from "@/components/ui/skeleton"
import { LandingPagePreview } from "@/components/landing-pages/preview/landing-preview"
import React, { useEffect } from "react"

// Helper para convertir File a Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OfertaBannerPreviewCard } from "@/components/ofertas/oferta-banner-preview-card"

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
    // ... rest of destructuring
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
    livestreamEnabled,
    setLivestreamEnabled,
    livestreamConfig,
    setLivestreamConfig,
    handleOfertaFieldChange,
    handleBannersChange,
    handleSubmit,
    saving,
    isFormValid,
    productCards,
  } = useOfertaForm({
    pageId,
    returnPath: "/pagina-web/landing-pages"
  })

  // Estado para el modo de preview
  const [previewMode, setPreviewMode] = React.useState<"full" | "banner">("full")

  // Estado para almacenar URLs de base64 de las imágenes locales
  // Esto es necesario porque el iframe corre en otro puerto (3000) y no puede acceder
  // a blob: URLs creados en el puerto del dashboard (3002)
  const [imagePreviews, setImagePreviews] = React.useState<Record<string, string>>({})

  useEffect(() => {
    const processImages = async () => {
      const newPreviews: Record<string, string> = {}
      let hasChanges = false

      // Procesar cards
      for (const card of productCards) {
        if (card.image && !imagePreviews[card.tempId]) {
          try {
            const base64 = await fileToBase64(card.image)
            newPreviews[card.tempId] = base64
            hasChanges = true
          } catch (e) {
            console.error("Error converting card image", e)
          }
        }
      }

      // Procesar banners
      for (const banner of banners) {
        // Desktop Image
        const dKey = `${banner.id}-desktop`
        if (banner.files.desktop_image && !imagePreviews[dKey]) {
          try {
            const base64 = await fileToBase64(banner.files.desktop_image)
            newPreviews[dKey] = base64
            hasChanges = true
          } catch (e) { console.error(e) }
        }

        // Mobile Image
        const mKey = `${banner.id}-mobile`
        if (banner.files.mobile_image && !imagePreviews[mKey]) {
          try {
            const base64 = await fileToBase64(banner.files.mobile_image)
            newPreviews[mKey] = base64
            hasChanges = true
          } catch (e) { console.error(e) }
        }
      }

      if (hasChanges) {
        setImagePreviews(prev => ({ ...prev, ...newPreviews }))
      }
    }

    processImages()
  }, [productCards, banners])

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

          {/* Transmision en Vivo */}
          <Card>
            <CardHeader>
              <CardTitle>Transmision en Vivo</CardTitle>
              <CardDescription>
                Configura un YouTube Live para esta pagina
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="livestreamEnabled">Activar Live Stream</Label>
                  <p className="text-xs text-muted-foreground">
                    Embed de YouTube Live con chat y countdown
                  </p>
                </div>
                <Switch
                  id="livestreamEnabled"
                  checked={livestreamEnabled}
                  onCheckedChange={setLivestreamEnabled}
                />
              </div>

              {livestreamEnabled && (
                <>
                  <Separator />
                  <OfertaLivestreamConfig
                    config={livestreamConfig}
                    onConfigChange={setLivestreamConfig}
                  />
                </>
              )}
            </CardContent>
          </Card>

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
        <div className="lg:sticky lg:top-20 lg:self-start lg:h-[calc(100vh-120px)] flex flex-col gap-4">
          <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "full" | "banner")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="full">Sitio Completo</TabsTrigger>
              <TabsTrigger value="banner" disabled={!activeBanner}>Banner Actual</TabsTrigger>
            </TabsList>
          </Tabs>

          {previewMode === 'full' ? (
            <LandingPagePreview
              data={{
                page: {
                  title: titulo,
                  products_section_title: productSectionsTitle,
                  products_section_description: productSectionsDescription,
                  is_active: isActive,
                  page_type: livestreamEnabled ? 'livestream' : undefined,
                  livestream_config: livestreamEnabled ? livestreamConfig : undefined,
                  sections: productSections.map(s => ({
                    ...s,
                    // En preview, usamos TODAS las cards que coincidan con sectionId
                    // ignorando si s.products tiene los IDs o no (ya que s.products se actualiza al guardar)
                    product_card_ids: productCards
                      .filter(card => card.sectionId === s.id)
                      .map(card => card.tempId)
                  }))
                },
                banners: banners.map(b => ({
                  ...b.data,
                  id: b.id,
                  content_blocks: b.contentBlocks,
                  // Usar base64 si hay archivo local, sino la URL existente
                  desktop_image_url: b.files.desktop_image ? (imagePreviews[`${b.id}-desktop`] || '') : b.data.desktop_image_url,
                  mobile_image_url: b.files.mobile_image ? (imagePreviews[`${b.id}-mobile`] || '') : b.data.mobile_image_url,
                  // Videos por ahora siguen con blob URL (pueden no reproducirse cross-origin pero pesan mucho para base64)
                  desktop_video_url: b.files.desktop_video ? URL.createObjectURL(b.files.desktop_video) : b.data.desktop_video_url,
                  mobile_video_url: b.files.mobile_video ? URL.createObjectURL(b.files.mobile_video) : b.data.mobile_video_url,
                })),
                faqs: faqItems.map(f => ({
                  id: f.id,
                  pregunta: f.question,
                  respuesta: f.answer,
                  activo: true
                })),
                product_cards: productCards.map(card => ({
                  // Mapeo completo de producto para preview
                  id: card.tempId, // Usar tempId (que puede ser el ID real o uno temporal)
                  page_id: pageId || '',
                  // Usar base64 para previsualización cross-origin instantánea
                  image_url: card.image_url || (card.image ? (imagePreviews[card.tempId] || '') : ''),
                  title: card.title,
                  subtitle: card.subtitle,
                  description: card.description,
                  cta_text: card.cta_text,
                  cta_url: card.cta_url,
                  url: '',
                  content_position: card.content_position || 'center',
                  text_styles: card.text_styles || {},
                  status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  created_by: null
                }))
              }}
              baseUrl={process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"}
            />
          ) : (
            activeBanner && (
              <OfertaBannerPreviewCard
                activeBanner={{
                  ...activeBanner,
                  // Inject base64 previews if available
                  data: {
                    ...activeBanner.data,
                    desktop_image_url: activeBanner.files.desktop_image ? (imagePreviews[`${activeBanner.id}-desktop`] || '') : activeBanner.data.desktop_image_url,
                    mobile_image_url: activeBanner.files.mobile_image ? (imagePreviews[`${activeBanner.id}-mobile`] || '') : activeBanner.data.mobile_image_url,
                  }
                }}
                onPositionDesktopChange={(pos) => {
                  // Actualizar banners usando handleBannersChange
                  const updatedBanners = banners.map(b =>
                    b.id === activeBanner.id
                      ? { ...b, data: { ...b.data, position_desktop: pos } }
                      : b
                  )
                  handleBannersChange(updatedBanners)

                  // También actualizar el banner activo localmente para reflejar el cambio en tiempo real
                  // (handleBannersChange actualiza el estado global, pero necesitamos refrescar activeBanner)
                  // Nota: activeBanner se deriva de banners en useOfertaForm, así que esto debería ser automático
                  // si useOfertaForm actualiza activeBanner cuando banners cambia.
                }}
                onPositionMobileChange={(pos) => {
                  const updatedBanners = banners.map(b =>
                    b.id === activeBanner.id
                      ? { ...b, data: { ...b.data, position_mobile: pos } }
                      : b
                  )
                  handleBannersChange(updatedBanners)
                }}
                onBlockPositionChange={(blockId, device, pos) => {
                  const updatedBanners = banners.map(b => {
                    if (b.id !== activeBanner.id) return b;

                    // Update content blocks
                    const updatedBlocks = (b.contentBlocks || []).map(block => {
                      if (block.id !== blockId) return block;

                      if (device === 'mobile') {
                        return { ...block, position_mobile: pos };
                      } else {
                        return { ...block, position_desktop: pos };
                      }
                    });

                    return { ...b, contentBlocks: updatedBlocks };
                  })
                  handleBannersChange(updatedBanners)
                }}
              />
            )
          )}
        </div>
      </div>
    </form>
  )
}

// Exportar con memo para evitar re-renders innecesarios
export const LandingPageForm = memo(LandingPageFormComponent)
