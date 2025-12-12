import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { bannerEndpoints } from "@/lib/api";
import type { BannerPosition, BannerTextStyles, ContentBlock } from "@/types/banner";
import {
  gridToPercentage,
  getDefaultPosition,
} from "@/components/banners/utils/position-utils";
import { parsePlacementString } from "@/components/banners/utils/placement-parser";
import {
  buildCreateBannerFormData,
  buildUpdateBannerFormData,
  type BannerFormFields,
  type BannerMediaFiles,
  type ExistingMediaUrls,
} from "@/components/banners/utils/banner-form-builder";

function parsePositionFromBackend(
  pos: string | BannerPosition | null | undefined
): BannerPosition | null {
  if (!pos) return null;

  if (typeof pos === "string") {
    try {
      const parsed = JSON.parse(pos);
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        return parsed as BannerPosition;
      }
      return null;
    } catch {
      return null;
    }
  }

  if (typeof pos.x === "number" && typeof pos.y === "number") {
    return pos as BannerPosition;
  }

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
export function useBannerForm({
  mode,
  bannerId,
  initialPlacement,
}: UseBannerFormOptions) {
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
    color_font: "#ffffff", // Default: Modo claro para hero banners
    coordinates: "4-4",
    coordinates_mobile: "4-4",
    category_id: "",
    subcategory_id: "none",
    submenu_id: "none",
  });

  const [existingUrls, setExistingUrls] = useState<ExistingMediaUrls>({});

  // NUEVO: Estado para posiciones basadas en porcentajes
  const [positionDesktop, setPositionDesktop] = useState<BannerPosition>(
    getDefaultPosition()
  );
  const [positionMobile, setPositionMobile] = useState<BannerPosition>(
    getDefaultPosition()
  );

  // NUEVO: Estado para estilos de texto
  // NUEVO: Estilos de texto
  const [textStyles, setTextStyles] = useState<BannerTextStyles | undefined>();
  const [loadedContentBlocks, setLoadedContentBlocks] = useState<any[] | undefined>();

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

            // Parsear placement para extraer categoría, subcategoría y submenú
            const { categoryName, subcategoryName, submenuName } =
              parsePlacementString(banner.placement);

            console.log("Banner cargado del backend:", {
              placement: banner.placement,
              parsedCategoryName: categoryName,
              parsedSubcategoryName: subcategoryName,
              parsedSubmenuName: submenuName,
            });

            // Cargar datos del formulario
            setFormData({
              name: banner.name || "",
              placement: banner.placement || "home",
              link_url: banner.link_url || "",
              title: banner.title || "",
              description: banner.description || "",
              cta: banner.cta || "",
              // Mapear text_color_default del backend a color_font del frontend
              color_font: banner.color_font || (banner as any).text_color_default || "#ffffff",
              coordinates: banner.coordinates || "4-4",
              coordinates_mobile: banner.coordinates_mobile || "4-4",
              category_id: categoryName,
              subcategory_id: subcategoryName,
              submenu_id: submenuName,
            });

            // NUEVO: Cargar posiciones basadas en porcentajes (o convertir desde grid)
            const desktopPos =
              parsePositionFromBackend(banner.position_desktop) ||
              gridToPercentage(banner.coordinates) ||
              getDefaultPosition();
            const mobilePos =
              parsePositionFromBackend(banner.position_mobile) ||
              gridToPercentage(banner.coordinates_mobile) ||
              getDefaultPosition();

            setPositionDesktop(desktopPos);
            setPositionMobile(mobilePos);

            // NUEVO: Cargar estilos de texto si existen
            const parseTextStyles = (
              styles: any
            ): BannerTextStyles | undefined => {
              if (!styles) return undefined;
              if (typeof styles === "string") {
                try {
                  return JSON.parse(styles) as BannerTextStyles;
                } catch {
                  return undefined;
                }
              }
              return styles as BannerTextStyles;
            };

            setTextStyles(parseTextStyles(banner.text_styles));

            // NUEVO: Cargar content_blocks si existen
            if (banner.content_blocks) {
              try {
                const parsed = typeof banner.content_blocks === 'string' 
                  ? JSON.parse(banner.content_blocks) 
                  : banner.content_blocks;
                setLoadedContentBlocks(Array.isArray(parsed) ? parsed : []);
                console.log("Content blocks cargados:", parsed);
              } catch (error) {
                console.error("Error parsing content_blocks:", error);
                setLoadedContentBlocks([]);
              }
            } else {
              setLoadedContentBlocks([]);
            }
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
    const isHeroOrHome =
      formData.placement === "hero" || formData.placement === "home";

    if (isHeroOrHome) {
      // Validar imagen desktop (nueva o existente)
      const hasDesktopImage =
        formData.desktop_image || existingUrls.desktop_image_url;
      if (!hasDesktopImage) {
        return {
          success: false,
          error:
            "La imagen de escritorio es obligatoria para banners Hero y Home",
        };
      }

      // Validar imagen mobile (nueva o existente)
      const hasMobileImage =
        formData.mobile_image || existingUrls.mobile_image_url;
      if (!hasMobileImage) {
        return {
          success: false,
          error: "La imagen móvil es obligatoria para banners Hero y Home",
        };
      }
    }

    return { success: true };
  };

  // Envío del formulario
  const prepareAndSend = async (status: "draft" | "active", contentBlocks?: ContentBlock[]) => {
    // SIMPLIFICACIÓN: El backend NO necesita category_id, subcategory_id, submenu_id
    // Solo necesita el placement string para determinar dónde mostrar el banner
    // Ejemplo: "banner-Dispositivos móviles-Galaxy Tab-Galaxy Tab A"
    // El frontend parseará este string para mostrar el banner en el lugar correcto

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
      // NO enviamos category_id, subcategory_id, submenu_id
      // El placement es suficiente
      category_id: undefined,
      subcategory_id: undefined,
      submenu_id: undefined,
      // NUEVO: Posiciones basadas en porcentajes
      position_desktop: positionDesktop,
      position_mobile: positionMobile,
      // NUEVO: Estilos de texto
      text_styles: textStyles,
      // NUEVO: Bloques de contenido
      content_blocks: contentBlocks,
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
    const data = buildUpdateBannerFormData(
      bannerId,
      fields,
      files,
      existingUrls,
      status
    );
    return bannerEndpoints.update(data);
  };

  const handleSubmit = async (
    status: "draft" | "active",
    contentBlocks?: ContentBlock[],
    onValidationError?: (error: string) => void
  ) => {
    const validation = validate();
    if (!validation.success) {
      if (validation.error && onValidationError)
        onValidationError(validation.error);
      return;
    }

    setIsLoading(true);
    try {
      const response = await prepareAndSend(status, contentBlocks);
      if (response.success) {
        router.push("/marketing/banners");
      } else {
        const action = status === "draft" ? "guardar" : "publicar";
        alert(response.message || `Error al ${action} el banner`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
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
    // NUEVO: Content blocks cargados
    loadedContentBlocks,
  };
}
