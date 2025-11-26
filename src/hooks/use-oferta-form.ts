import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BannerTextStyles, BannerPosition } from "@/types/banner"
import { pageEndpoints } from "@/lib/api"
import type { CreateCompletePageRequest, NewBanner, PageFAQ, BannerFiles as ApiBannerFiles } from "@/types/page"
import { useAuth } from "@/contexts/AuthContext"

const DEFAULT_TEXT_STYLES: BannerTextStyles = {
  title: { fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: "700", lineHeight: "1.2" },
  description: { fontSize: "clamp(1rem, 2vw, 1.5rem)", fontWeight: "400", lineHeight: "1.5" },
  cta: { fontSize: "1rem", fontWeight: "600", padding: "0.75rem 1.5rem", borderWidth: "0px" },
}

interface BannerData {
  id: string
  name: string
  placement: string
  link_url: string
  title: string
  description: string
  cta: string
  color_font: string
  coordinates: string
  coordinates_mobile: string
}

interface BannerFiles {
  desktop_image?: File
  desktop_video?: File
  mobile_image?: File
  mobile_video?: File
}

export interface BannerItem {
  id: string
  data: BannerData
  files: BannerFiles
  textStyles: BannerTextStyles
  positionDesktop: BannerPosition
  positionMobile: BannerPosition
}

interface ProductSection {
  id: string
  name: string
  type: "categoria" | "menu" | "submenu"
  categoryId?: string
  menuId?: string
  submenuId?: string
  useBackgroundImage: boolean
  backgroundImage?: File | string
  products: string[]
}

interface InfoItem {
  id: string
  title: string
  image?: File | string
  linkUrl: string
}

interface FaqItem {
  id: string
  question: string
  answer: string
}

export function useOfertaForm() {
  const { user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados de oferta
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Estados de banners
  const [bannersEnabled, setBannersEnabled] = useState(false)
  const [banners, setBanners] = useState<BannerItem[]>([
    {
      id: "banner-1",
      data: {
        id: "banner-1",
        name: "Banner 1",
        placement: "ofertas-nueva-oferta",
        link_url: "",
        title: "",
        description: "",
        cta: "",
        color_font: "#000000",
        coordinates: "",
        coordinates_mobile: "",
      },
      files: {},
      textStyles: DEFAULT_TEXT_STYLES,
      positionDesktop: { x: 10, y: 50 },
      positionMobile: { x: 10, y: 50 },
    },
  ])
  const [activeBannerId, setActiveBannerId] = useState("banner-1")

  // Estados de secciones de productos
  const [productSections, setProductSections] = useState<ProductSection[]>([
    {
      id: "section-1",
      name: "Productos Destacados",
      type: "categoria",
      useBackgroundImage: false,
      products: [],
    },
  ])

  // Estados de sección informativa
  const [infoSectionEnabled, setInfoSectionEnabled] = useState(false)
  const [infoItems, setInfoItems] = useState<InfoItem[]>([])

  // Estados de FAQ
  const [faqEnabled, setFaqEnabled] = useState(false)
  const [faqItems, setFaqItems] = useState<FaqItem[]>([])

  const activeBanner = banners.find((b) => b.id === activeBannerId)

  const handleOfertaFieldChange = (field: string, value: string) => {
    switch (field) {
      case "titulo":
        setTitulo(value)
        if (value.trim()) {
          const normalizedTitle = value.trim().toLowerCase().replace(/\s+/g, '-')
          const newPlacement = `ofertas-${normalizedTitle}`
          setBanners(prev => prev.map(b => ({
            ...b,
            data: { ...b.data, placement: newPlacement }
          })))
        }
        break
      case "descripcion":
        setDescripcion(value)
        break
      case "fechaInicio":
        setFechaInicio(value)
        break
      case "fechaFin":
        setFechaFin(value)
        break
    }
  }

  const handleBannersChange = (updatedBanners: Array<{ id: string; data: BannerData; files: BannerFiles; textStyles: BannerTextStyles }>) => {
    const normalizedTitle = titulo.trim() ? titulo.trim().toLowerCase().replace(/\s+/g, '-') : 'nueva-oferta'
    const currentPlacement = `ofertas-${normalizedTitle}`
    
    setBanners(prev =>
      updatedBanners.map(ub => {
        const existing = prev.find(p => p.id === ub.id)
        return existing
          ? { ...existing, ...ub, data: { ...ub.data, placement: currentPlacement } }
          : { ...ub, data: { ...ub.data, placement: currentPlacement }, positionDesktop: { x: 10, y: 50 }, positionMobile: { x: 10, y: 50 } }
      })
    )
  }

  const handlePositionDesktopChange = (position: BannerPosition) => {
    setBanners(prev =>
      prev.map(b => (b.id === activeBannerId ? { ...b, positionDesktop: position } : b))
    )
  }

  const handlePositionMobileChange = (position: BannerPosition) => {
    setBanners(prev =>
      prev.map(b => (b.id === activeBannerId ? { ...b, positionMobile: position } : b))
    )
  }

  const isFormValid = () => {
    if (!titulo.trim()) return false
    if (!fechaInicio || !fechaFin) return false
    if (new Date(fechaInicio) > new Date(fechaFin)) return false
    if (bannersEnabled && banners.some(b => !b.data.name.trim())) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevenir múltiples submissions
    if (isSubmitting || saving) {
      console.log("Submit bloqueado: Ya hay una petición en proceso")
      return
    }

    if (!isFormValid()) {
      toast.error("Por favor completa todos los campos requeridos correctamente")
      return
    }

    setIsSubmitting(true)
    setSaving(true)
    try {
      // Generar slug desde el título
      const slug = titulo.trim().toLowerCase().replace(/\s+/g, '-')
      
      // 1. Preparar banners nuevos y archivos
      const newBanners: NewBanner[] = []
      const bannerFiles: ApiBannerFiles[] = []
      
      if (bannersEnabled) {
        banners.forEach((banner) => {
          newBanners.push({
            name: banner.data.name,
            placement: banner.data.placement,
            status: "active",
            title: banner.data.title,
            description: banner.data.description,
            cta: banner.data.cta,
            color_font: banner.data.color_font,
            link_url: banner.data.link_url,
            coordinates: banner.data.coordinates,
            coordinates_mobile: banner.data.coordinates_mobile,
            position_desktop: banner.positionDesktop,
            position_mobile: banner.positionMobile,
          })
          
          bannerFiles.push({
            desktop_image: banner.files.desktop_image,
            mobile_image: banner.files.mobile_image,
            desktop_video: banner.files.desktop_video,
            mobile_video: banner.files.mobile_video,
          })
        })
      }
      
      // 2. Preparar FAQs
      const newFaqs: PageFAQ[] = faqEnabled
        ? faqItems.map((faq, index) => ({
            pregunta: faq.question,
            respuesta: faq.answer,
            activo: true,
            categoria: "Ofertas",
            prioridad: index + 1,
          }))
        : []
      
      // 3. Preparar secciones de info
      const infoSections = infoSectionEnabled
        ? infoItems.map((item, index) => ({
            id: item.id,
            title: item.title,
            content: `<a href="${item.linkUrl}">Ver más</a>`,
            order: index + 1,
          }))
        : []
      
      // 4. Construir request
      const request: CreateCompletePageRequest = {
        page: {
          slug,
          title: titulo,
          status: "published",
          created_by: user?.email || "unknown@imagiq.com",
          valid_from: fechaInicio || undefined,
          valid_until: fechaFin || undefined,
          sections: productSections.map((section, index) => ({
            id: section.id,
            name: section.name,
            order: index + 1,
            type: section.type,
            category_id: section.categoryId,
            menu_id: section.menuId,
            submenu_id: section.submenuId,
            product_ids: section.products,
            use_background_image: section.useBackgroundImage,
            background_image_url: typeof section.backgroundImage === 'string' 
              ? section.backgroundImage 
              : undefined,
          })),
          info_sections: infoSections,
          meta_title: titulo,
          meta_description: descripcion,
          category: "Ofertas",
          is_public: true,
          is_active: isActive,
        },
        new_banners: newBanners,
        existing_banner_ids: [],
        new_faqs: newFaqs,
        existing_faq_ids: [],
        banner_files: bannerFiles,
      }
      
      // Log para debug
      console.log("Enviando datos al backend:", {
        page: request.page,
        new_banners: request.new_banners,
        new_faqs: request.new_faqs,
        banner_files_count: request.banner_files.length,
      })
      
      // 5. Enviar al backend
      const response = await pageEndpoints.createComplete(request)
      
      console.log("Respuesta del backend:", response)
      
      // El backend puede retornar en dos formatos:
      // 1. Formato completo: { success: true, data: { page, created_banner_ids, created_faq_ids }, message }
      // 2. Formato directo: el objeto Page directamente (sin wrapper)
      
      // Detectar si es formato directo (tiene 'id' y 'slug' directamente)
      const isDirectPageResponse = response && 'id' in response && 'slug' in response
      
      // Validar éxito
      const isSuccess = 
        response.success === true || // Formato completo con success
        (response.success !== false && response.data && response.data.page) || // Formato completo sin success pero con data
        isDirectPageResponse // Formato directo (el backend retornó el Page directamente)
      
      if (isSuccess) {
        toast.success("Oferta creada exitosamente")
        router.push("/pagina-web/ofertas")
      } else {
        console.error("Respuesta considerada como error:", response)
        toast.error(response.message || "Error al crear la oferta")
      }
    } catch (error) {
      console.error("Error en el proceso:", error)
      
      // Si el error es de red o timeout, la oferta pudo haberse creado
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('Network') ||
          errorMessage.includes('timeout')) {
        toast.error(
          "Error de conexión. La oferta pudo haberse creado. Verifica en la lista de ofertas.",
          { duration: 5000 }
        )
      } else {
        toast.error(`Error: ${errorMessage}`)
      }
    } finally {
      setSaving(false)
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push("/pagina-web/ofertas")
  }

  return {
    // Estados de oferta
    titulo,
    descripcion,
    fechaInicio,
    fechaFin,
    isActive,
    setIsActive,
    
    // Estados de banners
    bannersEnabled,
    setBannersEnabled,
    banners,
    activeBannerId,
    setActiveBannerId,
    activeBanner,
    
    // Estados de secciones de productos
    productSections,
    setProductSections,
    
    // Estados de sección informativa
    infoSectionEnabled,
    setInfoSectionEnabled,
    infoItems,
    setInfoItems,
    
    // Estados de FAQ
    faqEnabled,
    setFaqEnabled,
    faqItems,
    setFaqItems,
    
    // Handlers
    handleOfertaFieldChange,
    handleBannersChange,
    handlePositionDesktopChange,
    handlePositionMobileChange,
    handleSubmit,
    handleCancel,
    
    // Estado del formulario
    saving,
    isFormValid: isFormValid(),
  }
}
