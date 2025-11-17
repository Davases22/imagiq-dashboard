import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { bannerEndpoints } from "@/lib/api";
import type { BannerPosition, BannerTextStyles } from "@/types/banner";
import { gridToPercentage, getDefaultPosition } from "@/components/banners/utils/position-utils";
import {
  buildCreateBannerFormData,
  buildUpdateBannerFormData,
  type BannerFormFields,
  type BannerMediaFiles,
  type ExistingMediaUrls,
} from "@/components/banners/utils/banner-form-builder";

// Helpers extraídos para reducir la complejidad cognitiva del hook
function parsePlacementString(placement?: string) {
  let parsedCategoryId = "";
  let parsedSubcategoryId = "none";

  if (placement?.startsWith("banner-")) {
    const parts = placement.replace("banner-", "").split("-") ?? [];
    if (parts.length > 0) parsedCategoryId = parts[0];
    if (parts.length > 1) parsedSubcategoryId = parts.slice(1).join("-");
  }

  return { parsedCategoryId, parsedSubcategoryId };
}

function parsePositionFromBackend(pos: any): BannerPosition | null {
  if (!pos) return null;
  if (typeof pos === "string") {
    try {
      pos = JSON.parse(pos);
    } catch {
      return null;
    }
  }
  if (typeof pos.x === "number" && typeof pos.y === "number") return pos as BannerPosition;
  return null;
}

export interface BannerFormData extends BannerFormFields, BannerMediaFiles {}

interface UseBannerFormOptions {
  mode: "create" | "edit";
  bannerId?: string;
  initialPlacement: string;
}

/**
 * Hook personalizado para manejar la lógica de formularios de banner (crear y editar)
 * Centraliza:
 * - Estado del formulario
 * - Carga de datos (para edición)
 * - Handlers de cambio
 * - Envío del formulario
 */
export function useBannerForm({ mode, bannerId, initialPlacement }: UseBannerFormOptions) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(mode === "edit");

  const [formData, setFormData] = useState<BannerFormData>({
    name: "",
    placement: initialPlacement,
    link_url: "",
    title: "",
    description: "",
    cta: "",
    color_font: "#000000",
    coordinates: "4-4",
    coordinates_mobile: "4-4",
    category_id: "",
    subcategory_id: "none",
  });

  const [existingUrls, setExistingUrls] = useState<ExistingMediaUrls>({});

  // NUEVO: Estado para posiciones basadas en porcentajes
  const [positionDesktop, setPositionDesktop] = useState<BannerPosition>(getDefaultPosition());
  const [positionMobile, setPositionMobile] = useState<BannerPosition>(getDefaultPosition());

  // NUEVO: Estado para estilos de texto
  // NUEVO: Estilos de texto
  const [textStyles, setTextStyles] = useState<BannerTextStyles | undefined>();

  // Cargar banner existente si estamos en modo edición
  useEffect(() => {
    if (mode === "edit" && bannerId) {
      const fetchBanner = async () => {
        try {
          const formData = new FormData();
          formData.append("id", bannerId);

          const response = await bannerEndpoints.update(formData);

          if (response.success && response.data) {
            const banner = response.data;

            // Guardar URLs existentes
            setExistingUrls({
              desktop_image_url: banner.desktop_image_url,
              desktop_video_url: banner.desktop_video_url,
              mobile_image_url: banner.mobile_image_url,
              mobile_video_url: banner.mobile_video_url,
            });

            // Parsear placement para extraer category_id y subcategory_id
            // Formato: "banner-{categoria}" o "banner-{categoria}-{subcategoria}"
            let parsedCategoryId = "";
            let parsedSubcategoryId = "none";

            if (banner.placement?.startsWith("banner-")) {
              // Usar optional chaining para evitar warnings y manejar undefined de forma segura
              const parts = banner.placement?.replace("banner-", "")?.split("-") ?? [];
              // El primer elemento es el nombre de la categoría
              if (parts.length > 0) parsedCategoryId = parts[0];
              // Si hay más elementos, los demás son la subcategoría (unidos por -)
              if (parts.length > 1) parsedSubcategoryId = parts.slice(1).join("-");
            }

            console.log("Banner cargado del backend:", {
              placement: banner.placement,
              parsedCategoryName: parsedCategoryId,
              parsedSubcategoryName: parsedSubcategoryId,
            });

            // Cargar datos del formulario
            setFormData({
              name: banner.name || "",
              placement: banner.placement || "home",
              link_url: banner.link_url || "",
              title: banner.title || "",
              description: banner.description || "",
              cta: banner.cta || "",
              color_font: banner.color_font || "#000000",
              coordinates: banner.coordinates || "4-4",
              coordinates_mobile: banner.coordinates_mobile || "4-4",
              category_id: parsedCategoryId,
              subcategory_id: parsedSubcategoryId,
            });

            // NUEVO: Cargar posiciones basadas en porcentajes (o convertir desde grid)
            // Helper para validar y parsear posiciones del backend
            const parsePosition = (pos: any): BannerPosition | null => {
              if (!pos) return null;
              // Si es string, intentar parsear JSON
              if (typeof pos === 'string') {
                try {
                  pos = JSON.parse(pos);
                } catch {
                  return null;
                }
              }
              // Validar que tenga x e y numéricos
              if (typeof pos.x === 'number' && typeof pos.y === 'number') {
                return pos as BannerPosition;
              }
              return null;
            };

            const desktopPos = parsePosition(banner.position_desktop)
              || gridToPercentage(banner.coordinates)
              || getDefaultPosition();
            const mobilePos = parsePosition(banner.position_mobile)
              || gridToPercentage(banner.coordinates_mobile)
              || getDefaultPosition();

            setPositionDesktop(desktopPos);
            setPositionMobile(mobilePos);

            // NUEVO: Cargar estilos de texto si existen
            const parseTextStyles = (styles: any): BannerTextStyles | undefined => {
              if (!styles) return undefined;
              if (typeof styles === 'string') {
                try {
                  return JSON.parse(styles) as BannerTextStyles;
                } catch {
                  return undefined;
                }
              }
              return styles as BannerTextStyles;
            };

            setTextStyles(parseTextStyles(banner.text_styles));
          } else {
            alert("No se pudo cargar el banner");
            router.push("/marketing/banners");
          }
        } catch (error) {
          console.error("Error loading banner:", error);
          alert("Error al cargar el banner");
          router.push("/marketing/banners");
        } finally {
          setIsFetching(false);
        }
      };

      fetchBanner();
    }
  }, [mode, bannerId, router]);

  // Handlers
  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const handleCoordinatesChange = (newCoordinates: string) => {
    setFormData((prev) => ({ ...prev, coordinates: newCoordinates }));
  };

  const handleCoordinatesMobileChange = (newCoordinates: string) => {
    setFormData((prev) => ({ ...prev, coordinates_mobile: newCoordinates }));
  };

  // NUEVO: Handlers para posiciones basadas en porcentajes
  const handlePositionDesktopChange = (position: BannerPosition) => {
    setPositionDesktop(position);
  };

  const handlePositionMobileChange = (position: BannerPosition) => {
    setPositionMobile(position);
  };

  // NUEVO: Handlers para estilos de texto
  const handleTextStylesChange = (styles: BannerTextStyles) => {
    setTextStyles(styles);
  };

  // Validación - retorna un objeto con success y error message
  const validate = (): { success: boolean; error?: string } => {
    if (!formData.name) {
      return { success: false, error: "El nombre del banner es obligatorio" };
    }

    // Validar imágenes obligatorias para hero y home
    const isHeroOrHome = formData.placement === "hero" || formData.placement === "home";

    if (isHeroOrHome) {
      // Validar imagen desktop (nueva o existente)
      const hasDesktopImage = formData.desktop_image || existingUrls.desktop_image_url;
      if (!hasDesktopImage) {
        return { success: false, error: "La imagen de escritorio es obligatoria para banners Hero y Home" };
      }

      // Validar imagen mobile (nueva o existente)
      const hasMobileImage = formData.mobile_image || existingUrls.mobile_image_url;
      if (!hasMobileImage) {
        return { success: false, error: "La imagen móvil es obligatoria para banners Hero y Home" };
      }
    }

    return { success: true };
  };

  // Envío del formulario
  const prepareAndSend = async (status: "draft" | "active") => {
    const fields: BannerFormFields = {
      name: formData.name,
      placement: formData.placement,
      link_url: formData.link_url,
      title: formData.title,
      description: formData.description,
      cta: formData.cta,
      color_font: formData.color_font,
      coordinates: formData.coordinates,
      coordinates_mobile: formData.coordinates_mobile,
      category_id: formData.category_id,
      subcategory_id: formData.subcategory_id === "none" ? "" : formData.subcategory_id,
      // NUEVO: Posiciones basadas en porcentajes
      position_desktop: positionDesktop,
      position_mobile: positionMobile,
      // NUEVO: Estilos de texto
      text_styles: textStyles,
    };

    const files: BannerMediaFiles = {
      desktop_image: formData.desktop_image,
      desktop_video: formData.desktop_video,
      mobile_image: formData.mobile_image,
      mobile_video: formData.mobile_video,
    };

    if (mode === "create") {
      const data = buildCreateBannerFormData(fields, files, status);
      return bannerEndpoints.create(data);
    }

    if (!bannerId) throw new Error("Banner ID is required for edit mode");
    const data = buildUpdateBannerFormData(bannerId, fields, files, existingUrls, status);
    return bannerEndpoints.update(data);
  };

  const handleSubmit = async (status: "draft" | "active", onValidationError?: (error: string) => void) => {
    const validation = validate();
    if (!validation.success) {
      if (validation.error && onValidationError) onValidationError(validation.error);
      return;
    }

    setIsLoading(true);
    try {
      const response = await prepareAndSend(status);
      if (response.success) {
        router.push("/marketing/banners");
      } else {
        const action = status === "draft" ? "guardar" : "publicar";
        alert(response.message || `Error al ${action} el banner`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      alert(errorMessage);
      console.error("Error submitting banner:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
    // NUEVO: Estilos de texto
    textStyles,
    handleTextStylesChange,
  };
}
