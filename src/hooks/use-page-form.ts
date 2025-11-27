/**
 * Hook para manejar el formulario de creación de páginas
 * Integra la creación transaccional de página + banners + FAQs
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pageEndpoints } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type {
  CreateCompletePageRequest,
  ProductSection,
  InfoSection,
  NewBanner,
  PageFAQ,
  BannerFiles,
} from "@/types/page";

// Datos del formulario de oferta (mapea a tu estructura actual)
export interface OfertaBanner {
  id?: string; // Si tiene ID, es existente
  name: string;
  title: string;
  description: string;
  cta: string;
  linkUrl: string;
  desktopImage?: File;
  mobileImage?: File;
  desktopVideo?: File;
  mobileVideo?: File;
  colorFont?: string;
  placement?: string;
}

export interface OfertaFaq {
  id?: string; // Si tiene ID, es existente
  question: string;
  answer: string;
  order?: number;
  category?: string;
}

export interface OfertaFormData {
  // Datos básicos
  slug: string;
  title: string;
  status: "draft" | "published" | "scheduled" | "archived";
  validFrom?: string;
  validUntil?: string;

  // Secciones
  sections: ProductSection[];
  infoSections?: InfoSection[];

  // Banners y FAQs
  banners: OfertaBanner[];
  faqs: OfertaFaq[];

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;

  // Categorización
  category?: string;
  subcategory?: string;
  tags?: string;

  // Estado
  isPublic?: boolean;
  isActive?: boolean;
}

interface UsePageFormReturn {
  saving: boolean;
  error: string | null;
  createCompletePage: (data: OfertaFormData) => Promise<void>;
}

export function usePageForm(): UsePageFormReturn {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCompletePage = async (data: OfertaFormData) => {
    setSaving(true);
    setError(null);

    try {
      // 1. Separar banners nuevos de existentes
      const newBanners: NewBanner[] = [];
      const existingBannerIds: string[] = [];
      const bannerFiles: BannerFiles[] = [];

      data.banners.forEach((banner) => {
        if (banner.id) {
          // Banner existente - solo guardar ID
          existingBannerIds.push(banner.id);
        } else {
          // Banner nuevo - preparar datos y archivos
          newBanners.push({
            name: banner.name,
            placement: banner.placement || "page-hero",
            status: "active",
            title: banner.title,
            description: banner.description,
            cta: banner.cta,
            color_font: banner.colorFont || "#FFFFFF",
            link_url: banner.linkUrl,
          });

          // Agregar archivos
          bannerFiles.push({
            desktop_image: banner.desktopImage,
            mobile_image: banner.mobileImage,
            desktop_video: banner.desktopVideo,
            mobile_video: banner.mobileVideo,
          });
        }
      });

      // 2. Separar FAQs nuevos de existentes
      const newFaqs: PageFAQ[] = [];
      const existingFaqIds: string[] = [];

      data.faqs.forEach((faq) => {
        if (faq.id) {
          // FAQ existente
          existingFaqIds.push(faq.id);
        } else {
          // FAQ nuevo
          newFaqs.push({
            pregunta: faq.question,
            respuesta: faq.answer,
            activo: true,
            categoria: faq.category || data.category || "General",
            prioridad: faq.order || 0,
          });
        }
      });

      // 3. Construir request
      const request: CreateCompletePageRequest = {
        page: {
          slug: data.slug,
          title: data.title,
          status: data.status || "draft",
          created_by: user?.email || "unknown@imagiq.com",
          valid_from: data.validFrom,
          valid_until: data.validUntil,
          sections: data.sections.map((section, index) => ({
            id: section.id,
            name: section.name,
            order: index + 1,
            product_ids: section.products,
          })),
          info_sections: data.infoSections || [],
          meta_title: data.metaTitle,
          meta_description: data.metaDescription,
          meta_keywords: data.metaKeywords,
          og_image: data.ogImage,
          category: data.category,
          subcategory: data.subcategory,
          tags: data.tags,
          is_public: data.isPublic !== false,
          is_active: data.isActive !== false,
        },
        new_banners: newBanners,
        existing_banner_ids: existingBannerIds,
        new_faqs: newFaqs,
        existing_faq_ids: existingFaqIds,
        banner_files: bannerFiles,
      };

      // 4. Enviar al backend
      const response = await pageEndpoints.createComplete(request);

      if (response.success) {
        // Redirigir a la lista de páginas o a la página creada
        router.push("/pagina-web/ofertas");
      } else {
        setError(response.message || "Error al crear la página");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      console.error("Error creating page:", err);
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    error,
    createCompletePage,
  };
}
