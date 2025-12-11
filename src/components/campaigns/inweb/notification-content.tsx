"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Upload, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface NotificationContentData {
  contentType: "image" | "html";
  image: string; // Base64 preview string for display
  imageFile?: File | null; // File object for upload
  url: string;
  previewUrl: string;
  htmlContent: string;
}

interface NotificationContentProps {
  data: NotificationContentData;
  onChange: (data: NotificationContentData) => void;
  displayStyle?: "popup" | "slider";
}

export function NotificationContent({ data, onChange, displayStyle }: NotificationContentProps) {
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          // Solo validar dimensiones si es slider
          if (displayStyle === "slider") {
            const isValid = img.width === 1480 && img.height === 392;
            if (!isValid) {
              setImageError(
                `Para slider, la imagen debe tener dimensiones de 1480x392 píxeles. La imagen seleccionada tiene ${img.width}x${img.height} píxeles.`
              );
              resolve(false);
            } else {
              setImageError(null);
              resolve(true);
            }
          } else {
            setImageError(null);
            resolve(true);
          }
        };
        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  };

  // Limpiar la imagen cuando cambia el displayStyle
  useEffect(() => {
    if (data.image && data.contentType === "image") {
      onChange({
        ...data,
        image: "",
        imageFile: null,
      });
      setImageError(null);
      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [displayStyle]); // Solo ejecutar cuando cambie displayStyle

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Contenido de la Notificación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="contentType">Tipo de Contenido</Label>
          <Select
            value={data.contentType}
            onValueChange={(value: "image" | "html") =>
              onChange({ ...data, contentType: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Imagen con URL</SelectItem>
              <SelectItem value="html">HTML Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.contentType === "image" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="imageUpload">
                Subir Imagen
                {displayStyle === "slider" && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Dimensiones requeridas: 1480x392 px)
                  </span>
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file type
                      if (!file.type.startsWith("image/")) {
                        setImageError("Por favor selecciona un archivo de imagen válido");
                        e.target.value = '';
                        return;
                      }

                      // Validate file size (max 10MB)
                      const maxSize = 10 * 1024 * 1024; // 10MB
                      if (file.size > maxSize) {
                        setImageError("La imagen no puede ser mayor a 10MB");
                        e.target.value = '';
                        return;
                      }

                      const isValid = await validateImageDimensions(file);

                      if (isValid) {
                        // Store File object for upload
                        // Create preview for display
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          onChange({
                            ...data,
                            image: reader.result as string, // Base64 preview
                            imageFile: file, // File object for upload
                          });
                        };
                        reader.readAsDataURL(file);
                      } else {
                        // Limpiar el input si la imagen no es válida
                        e.target.value = '';
                      }
                    }
                  }}
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {imageError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{imageError}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL de Destino</Label>
              <Input
                id="url"
                placeholder="https://tuempresa.com/ofertas"
                value={data.url}
                onChange={(e) =>
                  onChange({
                    ...data,
                    url: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                URL a la que se redirige al hacer clic en la notificación
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="previewUrl">URL del Preview (Iframe)</Label>
              <Input
                id="previewUrl"
                placeholder="https://imagiq-frontend.vercel.app/productos"
                value={data.previewUrl}
                onChange={(e) =>
                  onChange({
                    ...data,
                    previewUrl: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                URL que se mostrará en el fondo del preview
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="htmlContent">Contenido HTML</Label>
            <Textarea
              id="htmlContent"
              placeholder="<div style='padding: 20px; background: linear-gradient(to right, #667eea, #764ba2); color: white;'>
  <h2>¡Oferta Especial!</h2>
  <p>50% de descuento en todos los productos</p>
</div>"
              value={data.htmlContent}
              onChange={(e) =>
                onChange({
                  ...data,
                  htmlContent: e.target.value,
                })
              }
              rows={8}
              className="font-mono text-sm max-h-96 overflow-y-auto"
            />
            <p className="text-xs text-muted-foreground">
              Puedes usar HTML y CSS inline para personalizar el contenido
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
