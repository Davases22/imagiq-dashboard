"use client";

import { useState, useEffect } from "react";
import { Upload, Video, Pencil, Trash2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NextImage from "next/image";
import { BANNER_SPECS } from "./banner-size-guide";

interface BannerMediaUploadProps {
  readonly files: {
    desktop_image?: File;
    desktop_video?: File;
    mobile_image?: File;
    mobile_video?: File;
  };
  readonly existingUrls?: {
    desktop_image_url?: string;
    desktop_video_url?: string;
    mobile_image_url?: string;
    mobile_video_url?: string;
  };
  readonly placement: string;
  readonly onFileChange: (field: string, file: File | undefined) => void;
}

interface MediaFieldProps {
  readonly id: string;
  readonly label: string;
  readonly accept: string;
  readonly file?: File;
  readonly existingUrl?: string;
  readonly isVideo: boolean;
  readonly onFileChange: (file: File | undefined) => void;
  readonly onRemove: () => void;
  readonly expectedDimensions?: { width: number; height: number };
}

function MediaField({
  id,
  label,
  accept,
  file,
  existingUrl,
  isVideo,
  onFileChange,
  onRemove,
  expectedDimensions
}: MediaFieldProps) {
  const [dimensionError, setDimensionError] = useState<string | null>(null);
  const hasNewFile = !!file;
  const hasExistingFile = !!existingUrl && !hasNewFile;
  const fileName = existingUrl ? existingUrl.split('/').pop() || 'Archivo actual' : '';

  // Determinar si es un banner de categoría (formato vertical 1080x1944 - 9:16)
  const isCategoryBanner = id.includes('desktop') && (label.includes('Banner') || label.includes('Categoría'));

  // Limpiar error cuando se elimina el archivo o cambia el archivo existente
  useEffect(() => {
    if (!file && !existingUrl) {
      setDimensionError(null);
    }
  }, [file, existingUrl]);

  // Función para validar dimensiones de imagen
  const validateImageDimensions = async (file: File): Promise<boolean> => {
    if (!expectedDimensions || isVideo) {
      console.log('⏭️ Skipping validation:', { hasExpectedDimensions: !!expectedDimensions, isVideo, id });
      return true;
    }

    console.log('🔍 Validating image dimensions for:', id, 'Expected:', expectedDimensions);

    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          console.log('📏 Image loaded - Width:', img.width, 'Height:', img.height);
          const isValid =
            img.width === expectedDimensions.width &&
            img.height === expectedDimensions.height;

          if (!isValid) {
            console.log('❌ Validation failed for:', id);
            setDimensionError(
              `La imagen debe tener ${expectedDimensions.width}×${expectedDimensions.height}px. ` +
              `La imagen seleccionada tiene ${img.width}×${img.height}px.`
            );
            resolve(false);
          } else {
            console.log('✅ Validation passed for:', id);
            setDimensionError(null);
            resolve(true);
          }
        };
        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  };

  // Handler para cambio de archivo con validación
  const handleFileChange = async (selectedFile: File | undefined) => {
    console.log('🎯 handleFileChange called for:', id, 'File:', selectedFile?.name);

    if (!selectedFile) {
      setDimensionError(null);
      onFileChange(undefined);
      return;
    }

    const isValid = await validateImageDimensions(selectedFile);
    console.log('✔️ Validation result for', id, ':', isValid);

    if (isValid) {
      console.log('✅ Accepting file for:', id);
      onFileChange(selectedFile);
    } else {
      console.log('❌ Rejecting file for:', id);
      // Limpiar el input si la validación falla
      const input = document.getElementById(id) as HTMLInputElement;
      if (input) input.value = '';
      onFileChange(undefined);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      {/* Mostrar archivo existente con preview */}
      {hasExistingFile && (
        <div className="space-y-2">
          <div className="relative group rounded-lg border overflow-hidden bg-muted/30">
            {/* Preview del archivo */}
            <div className="flex items-center gap-3 p-3">
              {/* Thumbnail/Preview - ajustado para formato vertical si es banner de categoría */}
              <div
                className={`relative rounded overflow-hidden bg-muted flex-shrink-0 ${
                  isCategoryBanner ? 'w-16 h-28' : 'w-20 h-20'
                }`}
                style={isCategoryBanner ? { aspectRatio: '9/16' } : undefined}
              >
                {isVideo ? (
                  // Preview de video con poster
                  <div className="w-full h-full flex items-center justify-center bg-black/5">
                    <Video className="h-8 w-8 text-muted-foreground" />
                    <video
                      src={existingUrl}
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                      muted
                    />
                  </div>
                ) : (
                  // Preview de imagen
                  <NextImage
                    src={existingUrl}
                    alt={label}
                    fill
                    className="object-cover"
                    sizes={isCategoryBanner ? '64px' : '80px'}
                  />
                )}
              </div>

              {/* Info del archivo */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Archivo actual</p>
                <p className="text-xs text-muted-foreground truncate">{fileName}</p>
                {isCategoryBanner && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato: 1080×1944px (9:16)
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                  onClick={() => document.getElementById(id)?.click()}
                  title="Cambiar archivo"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={onRemove}
                  title="Eliminar archivo"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <Input
            id={id}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
        </div>
      )}

      {/* Input para nuevo archivo (cuando no hay archivo existente) */}
      {!hasExistingFile && (
        <>
          <div className="flex items-center gap-2">
            <Input
              id={id}
              type="file"
              accept={accept}
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
            <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
          {hasNewFile && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{file.name}</p>
              {isCategoryBanner && (
                <p className="text-xs text-muted-foreground">
                  Formato recomendado: 1080×1944px (9:16)
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Error de validación de dimensiones */}
      {dimensionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {dimensionError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function BannerMediaUpload({ files, existingUrls, placement, onFileChange }: BannerMediaUploadProps) {
  // Para product-detail, mostrar solo una opción general (formato vertical)
  const isSingleMedia = placement === "product-detail";

  // Obtener dimensiones esperadas basadas en el placement
  const getDimensions = (isDesktop: boolean): { width: number; height: number } | undefined => {
    // Determinar el specKey según placement
    let specKey = placement;

    // Banners de categoría (verticales)
    if (placement.startsWith("banner-") || placement === "category-top") {
      specKey = "category-banner";
    }
    // Landing pages de ofertas (horizontales)
    else if (placement.startsWith("ofertas-")) {
      specKey = "ofertas-cazadores-de-ofertas";
    }

    const specs = BANNER_SPECS[specKey];
    if (!specs) {
      console.log('⚠️ No specs found for placement:', placement);
      return undefined;
    }

    const dimensions = isDesktop ? specs.desktop : specs.mobile;
    console.log('📐 Dimensions for', isDesktop ? 'Desktop' : 'Mobile', ':', dimensions);
    return dimensions;
  };

  if (isSingleMedia) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <MediaField
          id="desktop_image"
          label="Imagen del Banner"
          accept="image/*"
          file={files.desktop_image}
          existingUrl={existingUrls?.desktop_image_url}
          isVideo={false}
          onFileChange={(file) => onFileChange("desktop_image", file)}
          onRemove={() => onFileChange("desktop_image", undefined)}
          expectedDimensions={getDimensions(true)}
        />

        <MediaField
          id="desktop_video"
          label="Video del Banner"
          accept="video/*"
          file={files.desktop_video}
          existingUrl={existingUrls?.desktop_video_url}
          isVideo={true}
          onFileChange={(file) => onFileChange("desktop_video", file)}
          onRemove={() => onFileChange("desktop_video", undefined)}
        />
      </div>
    );
  }

  // Para todos los demás placements (hero, home, category-top, banner-*), mostrar desktop y mobile separados
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MediaField
        id="desktop_image"
        label="Imagen Desktop"
        accept="image/*"
        file={files.desktop_image}
        existingUrl={existingUrls?.desktop_image_url}
        isVideo={false}
        onFileChange={(file) => onFileChange("desktop_image", file)}
        onRemove={() => onFileChange("desktop_image", undefined)}
        expectedDimensions={getDimensions(true)}
      />

      <MediaField
        id="mobile_image"
        label="Imagen Mobile"
        accept="image/*"
        file={files.mobile_image}
        existingUrl={existingUrls?.mobile_image_url}
        isVideo={false}
        onFileChange={(file) => onFileChange("mobile_image", file)}
        onRemove={() => onFileChange("mobile_image", undefined)}
        expectedDimensions={getDimensions(false)}
      />

      <MediaField
        id="desktop_video"
        label="Video Desktop"
        accept="video/*"
        file={files.desktop_video}
        existingUrl={existingUrls?.desktop_video_url}
        isVideo={true}
        onFileChange={(file) => onFileChange("desktop_video", file)}
        onRemove={() => onFileChange("desktop_video", undefined)}
      />

      <MediaField
        id="mobile_video"
        label="Video Mobile"
        accept="video/*"
        file={files.mobile_video}
        existingUrl={existingUrls?.mobile_video_url}
        isVideo={true}
        onFileChange={(file) => onFileChange("mobile_video", file)}
        onRemove={() => onFileChange("mobile_video", undefined)}
      />
    </div>
  );
}
