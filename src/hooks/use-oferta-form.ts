import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BannerTextStyles, BannerPosition } from "@/types/banner"
import { pageEndpoints } from "@/lib/api"
import type { CreateCompletePageRequest, NewBanner, PageFAQ, BannerFiles as ApiBannerFiles, ProductSection as BackendProductSection, InfoSection, PageExpanded } from "@/types/page"
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

interface UseOfertaFormOptions {
  pageId?: string
  returnPath?: string
}

export function useOfertaForm(options: UseOfertaFormOptions = {}) {
  const { pageId, returnPath = "/pagina-web/ofertas" } = options
  const { user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(!!pageId)

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
  const [productSectionsTitle, setProductSectionsTitle] = useState("")
  const [productSectionsDescription, setProductSectionsDescription] = useState("")
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

  // Cargar datos existentes si estamos en modo edición
  useEffect(() => {
    if (!pageId) return

    const loadPageData = async () => {
      try {
        setLoading(true)
        console.log('🔍 Cargando página con ID:', pageId)
        const response = await pageEndpoints.getById(pageId, ['banners', 'faqs'])
        console.log('📦 Respuesta completa del API:', JSON.stringify(response, null, 2))

        // Verificar si la respuesta tiene la estructura esperada
        if (!response) {
          console.error('❌ Respuesta vacía del API')
          toast.error('No se pudo cargar la página')
          return
        }

        // La respuesta puede tener diferentes estructuras, vamos a manejar ambas
        let pageData: PageExpanded | null = null

        // Caso 1: response.data.data (estructura wrapper doble)
        if (response.data?.data) {
          pageData = response.data.data
          console.log('✅ Datos encontrados en response.data.data')
        }
        // Caso 2: response.data (puede tener success y data como propiedades)
        else if (response.data && typeof response.data === 'object') {
          // Si tiene propiedad 'data', es un wrapper
          if ('data' in response.data) {
            pageData = (response.data as { data: PageExpanded }).data
            console.log('✅ Datos encontrados en response.data.data (wrapper)')
          }
          // Si tiene 'slug' y 'title', es PageExpanded directo
          else if ('slug' in response.data && 'title' in response.data) {
            pageData = response.data as unknown as PageExpanded
            console.log('✅ Datos encontrados en response.data (directo)')
          }
        }

        if (!pageData) {
          console.error('❌ No se encontraron datos en la respuesta:', response)
          toast.error('No se encontraron datos de la página')
          return
        }

        console.log('📄 Datos de la página a cargar:', pageData)

        // Cargar datos básicos
        setTitulo(pageData.title ?? '')
        setDescripcion(pageData.meta_description ?? '')
        setFechaInicio(pageData.valid_from ?? '')
        setFechaFin(pageData.valid_until ?? '')
        setIsActive(pageData.is_active ?? false)

        // Cargar título y descripción de sección de productos
        setProductSectionsTitle(pageData.products_section_title ?? '')
        setProductSectionsDescription(pageData.products_section_description ?? '')

        // Cargar secciones de productos
        if (pageData.sections && pageData.sections.length > 0) {
          console.log('📦 Cargando secciones:', pageData.sections.length)
          setProductSections(pageData.sections.map((s: BackendProductSection) => ({
            id: s.id,
            name: s.name,
            type: s.type,
            categoryId: s.category_id,
            menuId: s.menu_id,
            submenuId: s.submenu_id,
            useBackgroundImage: s.use_background_image,
            backgroundImage: s.background_image_url,
            products: s.product_ids,
          })))
        }

        // Cargar info sections si existen
        if (pageData.info_sections && pageData.info_sections.length > 0) {
          console.log('ℹ️ Cargando info sections:', pageData.info_sections.length)
          setInfoSectionEnabled(true)
          setInfoItems(pageData.info_sections.map((info: InfoSection) => ({
            id: info.id || crypto.randomUUID(),
            title: info.title,
            linkUrl: '', // InfoSection del backend no tiene linkUrl
          })))
        }

        // Cargar banners si existen
        if (pageData.banners && pageData.banners.length > 0) {
          console.log('🎨 Cargando banners:', pageData.banners.length)
          setBannersEnabled(true)
          // TODO: Mapear banners del backend al formato del formulario
        }

        // Cargar FAQs si existen
        if (pageData.faqs && pageData.faqs.length > 0) {
          console.log('❓ Cargando FAQs:', pageData.faqs.length)
          setFaqEnabled(true)
          setFaqItems(pageData.faqs.map((faq: any) => ({
            id: faq.id || crypto.randomUUID(),
            question: faq.pregunta || faq.question || '',
            answer: faq.respuesta || faq.answer || '',
          })))
        }

        toast.success('Página cargada correctamente')
      } catch (error) {
        console.error('💥 Error cargando página:', error)
        toast.error('Error al cargar los datos de la página')
      } finally {
        setLoading(false)
      }
    }

    loadPageData()
  }, [pageId])

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
          ...(pageId && { id: pageId }), // Incluir id solo si estamos editando
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
          products_section_title: productSectionsTitle || undefined,
          products_section_description: productSectionsDescription || undefined,
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
      console.log("📤 Enviando datos al backend:", {
        page: {
          ...request.page,
          sections_count: request.page.sections.length,
          info_sections_count: request.page.info_sections?.length || 0,
        },
        new_banners_count: request.new_banners.length,
        new_banners: request.new_banners,
        new_faqs_count: request.new_faqs.length,
        banner_files_count: request.banner_files.length,
        existing_banner_ids: request.existing_banner_ids,
        existing_faq_ids: request.existing_faq_ids,
      })
      
      console.log("📋 Detalle de secciones:", request.page.sections)
      console.log("🖼️ Detalle de banner files:", request.banner_files.map((f, i) => ({
        index: i,
        desktop_image: f.desktop_image?.name,
        mobile_image: f.mobile_image?.name,
      })))
      
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
        router.push(returnPath)
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
    router.push(returnPath)
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
    productSectionsTitle,
    setProductSectionsTitle,
    productSectionsDescription,
    setProductSectionsDescription,
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
    loading,
    saving,
    isFormValid: isFormValid(),
  }
}
