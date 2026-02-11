"use client";

import { useState, useEffect } from "react";
import { Upload, Video, Pencil, Trash2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NextImage from "next/image";
import { BANNER_SPECS } from "./banner-size-guide";

// ── Helpers de validación (fuera del componente para evitar nesting) ──

interface ValidationResult {
  valid: boolean;
  error: string | null;
}

function getOrientationLabel(ratio: number): string {
  if (ratio > 1) return "horizontal";
  if (ratio < 1) return "vertical";
  return "cuadrada";
}

function validateAspectRatio(
  img: HTMLImageElement,
  expected: { width: number; height: number }
): ValidationResult {
  const expectedRatio = expected.width / expected.height;
  const actualRatio = img.width / img.height;
  const deviation = Math.abs(expectedRatio - actualRatio) / expectedRatio;

  if (deviation >= 0.15) {
    return {
      valid: false,
      error:
        `Se recomienda una imagen ${getOrientationLabel(expectedRatio)} (~${expected.width}×${expected.height}px). ` +
        `La imagen seleccionada es ${getOrientationLabel(actualRatio)} (${img.width}×${img.height}px).`,
    };
  }
  return { valid: true, error: null };
}

function validateExactPixels(
  img: HTMLImageElement,
  expected: { width: number; height: number }
): ValidationResult {
  if (img.width === expected.width && img.height === expected.height) {
    return { valid: true, error: null };
  }
  return {
    valid: false,
    error:
      `La imagen debe tener ${expected.width}×${expected.height}px. ` +
      `La imagen seleccionada tiene ${img.width}×${img.height}px.`,
  };
}

function loadImageDimensions(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => resolve(img);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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
  readonly onRemoveExistingMedia?: (field: string) => void;
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
  readonly useAspectRatioValidation?: boolean;
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
  expectedDimensions,
  useAspectRatioValidation = false
}: MediaFieldProps) {
  const [dimensionError, setDimensionError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);
  const hasNewFile = !!file;
  const hasExistingFile = !!existingUrl && !hasNewFile;
  const fileName = existingUrl ? existingUrl.split('/').pop() || 'Archivo actual' : '';

  // Determinar si es un banner de categoría (formato vertical 1080x1944 - 9:16)
  const isCategoryBanner = id.includes('desktop') && (label.includes('Banner') || label.includes('Categoría'));

  // Generar preview URL y leer dimensiones cuando cambia el archivo
  useEffect(() => {
    if (!file || isVideo) {
      setPreviewUrl(null);
      setFileDimensions(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => setFileDimensions({ width: img.width, height: img.height });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, isVideo]);

  // Limpiar error cuando se elimina el archivo o cambia el archivo existente
  useEffect(() => {
    if (!file && !existingUrl) {
      setDimensionError(null);
    }
  }, [file, existingUrl]);

  // Función para validar dimensiones de imagen
  const validateImageDimensions = async (fileToValidate: File): Promise<boolean> => {
    if (!expectedDimensions || isVideo) return true;

    const img = await loadImageDimensions(fileToValidate);
    const result = useAspectRatioValidation
      ? validateAspectRatio(img, expectedDimensions)
      : validateExactPixels(img, expectedDimensions);

    setDimensionError(result.error);
    return result.valid;
  };

  // Handler para cambio de archivo con validación
  const handleFileChange = async (selectedFile: File | undefined) => {
    if (!selectedFile) {
      setDimensionError(null);
      onFileChange(undefined);
      return;
    }

    const isValid = await validateImageDimensions(selectedFile);

    if (isValid) {
      onFileChange(selectedFile);
    } else {
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
          {hasNewFile && previewUrl ? (
            <div className="relative group rounded-lg border overflow-hidden bg-muted/30">
              <div className="flex items-center gap-3 p-3">
                <div className="relative rounded overflow-hidden bg-muted flex-shrink-0 w-20 h-20">
                  <NextImage
                    src={previewUrl}
                    alt={label}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  {fileDimensions && (
                    <p className="text-xs text-muted-foreground">
                      {fileDimensions.width} × {fileDimensions.height}px
                    </p>
                  )}
                </div>
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
                    onClick={() => onFileChange(undefined)}
                    title="Eliminar archivo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Input
                id={id}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                id={id}
                type="file"
                accept={accept}
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
              <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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

export function BannerMediaUpload({ files, existingUrls, placement, onFileChange, onRemoveExistingMedia }: BannerMediaUploadProps) {
  // Para product-detail, mostrar solo una opción general (formato vertical)
  const isSingleMedia = placement === "product-detail";

  // Banners de formulario usan validación por aspect ratio (no píxeles exactos)
  const useAspectRatio = placement.startsWith("formularios-");

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
    // Formularios: placement ya es "formularios-{layout_type}" (mapea directo a BANNER_SPECS)

    const specs = BANNER_SPECS[specKey];
    if (!specs) {
      return undefined;
    }

    return isDesktop ? specs.desktop : specs.mobile;
  };

  // Helper para manejar eliminación de medios (limpia archivo Y URL existente)
  const handleRemove = (field: string) => {
    onFileChange(field, undefined);
    onRemoveExistingMedia?.(field);
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
          onRemove={() => handleRemove("desktop_image")}
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
          onRemove={() => handleRemove("desktop_video")}
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
        onRemove={() => handleRemove("desktop_image")}
        expectedDimensions={getDimensions(true)}
        useAspectRatioValidation={useAspectRatio}
      />

      <MediaField
        id="mobile_image"
        label="Imagen Mobile"
        accept="image/*"
        file={files.mobile_image}
        existingUrl={existingUrls?.mobile_image_url}
        isVideo={false}
        onFileChange={(file) => onFileChange("mobile_image", file)}
        onRemove={() => handleRemove("mobile_image")}
        expectedDimensions={getDimensions(false)}
        useAspectRatioValidation={useAspectRatio}
      />

      <MediaField
        id="desktop_video"
        label="Video Desktop"
        accept="video/*"
        file={files.desktop_video}
        existingUrl={existingUrls?.desktop_video_url}
        isVideo={true}
        onFileChange={(file) => onFileChange("desktop_video", file)}
        onRemove={() => handleRemove("desktop_video")}
      />

      <MediaField
        id="mobile_video"
        label="Video Mobile"
        accept="video/*"
        file={files.mobile_video}
        existingUrl={existingUrls?.mobile_video_url}
        isVideo={true}
        onFileChange={(file) => onFileChange("mobile_video", file)}
        onRemove={() => handleRemove("mobile_video")}
      />
    </div>
  );
}
