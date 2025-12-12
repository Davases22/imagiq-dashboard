"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Send, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBannerForm } from "@/hooks/use-banner-form";
import { useContentBlocks } from "@/hooks/use-content-blocks";
import { BannerFormFields } from "./banner-form-fields";
import { BannerMediaUpload } from "./banner-media-upload";
import { BannerCategoryFields } from "./banner-category-fields";
import { BannerPreview } from "../preview/banner-preview";
import { BannerSizeGuide } from "./banner-size-guide";
import { ContentBlocksManager } from "./content-boxes-manager";
import { buildNormalizedPlacement } from "@/utils/normalizeText";

interface BannerFormPageProps {
  readonly mode: "create" | "edit";
  readonly bannerId?: string;
  readonly initialPlacement: string;
}

/**
 * Componente compartido para crear y editar banners
 * Centraliza toda la UI del formulario y usa el hook useBannerForm para la lógica
 */
export function BannerFormPage({ mode, bannerId, initialPlacement }: BannerFormPageProps) {
  const router = useRouter();

  // Refs para guardar nombres y evitar race conditions con useState
  const categoryNameRef = useRef("");
  const subcategoryNameRef = useRef("");

  const {
    formData,
    existingUrls,
    isLoading,
    isFetching,
    handleFieldChange,
    handleFileChange,
    handleCoordinatesChange,
    handleCoordinatesMobileChange,
    handleSubmit,
    // NUEVO: Posiciones basadas en porcentajes
    positionDesktop,
    positionMobile,
    handlePositionDesktopChange,
    handlePositionMobileChange,
    // NUEVO: Content blocks cargados
    loadedContentBlocks,
  } = useBannerForm({ mode, bannerId, initialPlacement });

  // Hook para gestionar bloques de contenido
  const {
    blocks: contentBlocks,
    addBlock,
    removeBlock,
    updateBlock,
    updateBlockPosition,
    importBlocks,
  } = useContentBlocks();

  // Importar bloques cuando se carguen del backend (modo edición)
  useEffect(() => {
    if (loadedContentBlocks && loadedContentBlocks.length > 0) {
      importBlocks(loadedContentBlocks);
      console.log("Content blocks importados al editor:", loadedContentBlocks);
    }
  }, [loadedContentBlocks, importBlocks]);

  // Handler para cambios de posición de bloques desde el preview
  const handleBlockPositionChange = (blockId: string, device: 'desktop' | 'mobile', position: { x: number; y: number }) => {
    updateBlockPosition(blockId, device, position);
  };

  // Definir textos según el modo
  const pageTitle = mode === "create" ? "Crear Banner" : "Editar Banner";
  const pageDescription =
    mode === "create" ? "Configura tu nuevo banner" : "Modifica la configuración del banner";
  const backRoute =
    mode === "create" ? "/marketing/banners/crear/seleccionar-tipo" : "/marketing/banners";

  // Estado de carga
  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando banner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push(backRoute)}
          className="self-start"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{pageTitle}</h1>
            <Badge variant="secondary" className="capitalize self-start">
              {formData.placement}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{pageDescription}</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="space-y-3 sm:space-y-4">
          {/* Campos del formulario */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Información del Banner</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <BannerFormFields 
                formData={formData} 
                onFieldChange={handleFieldChange}
              />
            </CardContent>
          </Card>

          {/* Campos de categoría (solo para category-top o banners de categoría) */}
          {(formData.placement === "category-top" || formData.placement.startsWith("banner-")) && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Ubicación en Categoría</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <BannerCategoryFields
                  categoryId={formData.category_id}
                  subcategoryId={formData.subcategory_id}
                  submenuId={formData.submenu_id}
                  onCategoryChange={(categoryId, newCategoryName) => {
                    handleFieldChange("category_id", categoryId);
                    categoryNameRef.current = newCategoryName;
                    subcategoryNameRef.current = "";
                    handleFieldChange("submenu_id", "none");
                    // ✨ Actualizar placement solo con la categoría (NORMALIZADO)
                    handleFieldChange("placement", buildNormalizedPlacement(newCategoryName));
                  }}
                  onSubcategoryChange={(subcategoryId, newSubcategoryName) => {
                    handleFieldChange("subcategory_id", subcategoryId);
                    subcategoryNameRef.current = newSubcategoryName;
                    handleFieldChange("submenu_id", "none");
                    // ✨ Actualizar placement con categoría y subcategoría (NORMALIZADO)
                    const currentCategoryName = categoryNameRef.current;
                    const newPlacement = subcategoryId === "none" || !subcategoryId
                      ? buildNormalizedPlacement(currentCategoryName)
                      : buildNormalizedPlacement(currentCategoryName, newSubcategoryName);
                    handleFieldChange("placement", newPlacement);
                  }}
                  onSubmenuChange={(submenuId, newSubmenuName) => {
                    handleFieldChange("submenu_id", submenuId);
                    // ✨ Construir placement con los 3 niveles (NORMALIZADO)
                    const currentCategoryName = categoryNameRef.current;
                    const currentSubcategoryName = subcategoryNameRef.current;

                    let newPlacement: string;

                    if (currentSubcategoryName && currentSubcategoryName !== "none") {
                      if (submenuId !== "none" && newSubmenuName) {
                        // Nivel 3: banner-categoria-menu-submenu
                        newPlacement = buildNormalizedPlacement(
                          currentCategoryName,
                          currentSubcategoryName,
                          newSubmenuName
                        );
                      } else {
                        // Nivel 2: banner-categoria-menu
                        newPlacement = buildNormalizedPlacement(
                          currentCategoryName,
                          currentSubcategoryName
                        );
                      }
                    } else {
                      // Nivel 1: banner-categoria
                      newPlacement = buildNormalizedPlacement(currentCategoryName);
                    }

                    handleFieldChange("placement", newPlacement);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Guía de dimensiones - No mostrar para navbar mobile */}
          {formData.placement !== "notification" && <BannerSizeGuide placement={formData.placement} />}

          {/* Content Blocks - Solo para banners con contenido */}
          {formData.placement !== "notification" && (formData.placement === "hero" || 
            formData.placement === "home" || 
            formData.placement.startsWith("home-") ||
            formData.placement === "category-top" ||
            formData.placement.startsWith("banner-")) && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Bloques de Contenido</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Crea bloques con título, subtítulo, descripción y botones personalizables con configuración independiente para desktop y mobile.
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ContentBlocksManager
                  blocks={contentBlocks}
                  onAddBlock={addBlock}
                  onRemoveBlock={removeBlock}
                  onUpdateBlock={updateBlock}
                />
              </CardContent>
            </Card>
          )}

          {/* Upload de archivos - No mostrar para navbar mobile */}
          {formData.placement !== "notification" && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Archivos Multimedia</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <BannerMediaUpload
                  files={formData}
                  existingUrls={existingUrls}
                  placement={formData.placement}
                  onFileChange={handleFileChange}
                />
              </CardContent>
            </Card>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit("draft", contentBlocks, (error) => toast.error(error))}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Guardando...</span>
                  <span className="sm:hidden">Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Guardar Borrador</span>
                  <span className="sm:hidden">Borrador</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit("active", contentBlocks, (error) => toast.error(error))}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Publicando...</span>
                  <span className="sm:hidden">Publicando...</span>
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Publicar Banner</span>
                  <span className="sm:hidden">Publicar</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                Vista Previa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <BannerPreview
                desktop_image={formData.desktop_image || existingUrls.desktop_image_url}
                desktop_video={formData.desktop_video || existingUrls.desktop_video_url}
                mobile_image={formData.mobile_image || existingUrls.mobile_image_url}
                mobile_video={formData.mobile_video || existingUrls.mobile_video_url}
                title={formData.title}
                description={formData.description}
                cta={formData.cta}
                color_font={formData.color_font}
                link_url={formData.link_url}
                placement={formData.placement}
                position_desktop={positionDesktop}
                position_mobile={positionMobile}
                onPositionDesktopChange={handlePositionDesktopChange}
                onPositionMobileChange={handlePositionMobileChange}
                coordinates={formData.coordinates}
                coordinatesMobile={formData.coordinates_mobile}
                onCoordinatesChange={handleCoordinatesChange}
                onCoordinatesMobileChange={handleCoordinatesMobileChange}
                content_blocks={contentBlocks}
                onBlockPositionChange={handleBlockPositionChange}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}