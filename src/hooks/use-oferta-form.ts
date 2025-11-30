import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BannerTextStyles, BannerPosition } from "@/types/banner"
import { pageEndpoints, productCardEndpoints } from "@/lib/api"
import type { CreateCompletePageRequest, NewBanner, PageFAQ, BannerFiles as ApiBannerFiles, ProductSection, ProductSectionDTO, InfoSection, PageExpanded, BannerUpdate } from "@/types/page"
import type { ProductCard } from "@/types/product-card"
import { useAuth } from "@/contexts/AuthContext"
import { useProductCardsContext } from "@/contexts/ProductCardsContext"

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
  desktop_image_url?: string
  mobile_image_url?: string
  desktop_video_url?: string
  mobile_video_url?: string
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
  const { productCards, clearAll, loadExistingCards } = useProductCardsContext()
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
        const response = await pageEndpoints.getById(pageId, ['banners', 'faqs', 'product_cards'])

        // Verificar si la respuesta tiene la estructura esperada
        if (!response || !response.data) {
          console.error('❌ Error cargando página: Respuesta vacía del API')
          toast.error('No se pudo cargar la página')
          return
        }

        // Determinar dónde están los datos
        let pageData: PageExpanded
        
        // Si response.data tiene la propiedad 'data', los datos están ahí
        if ('data' in response.data && response.data.data) {
          pageData = response.data.data
        }
        // Si response.data tiene 'success' y 'data', es un wrapper
        else if ('success' in response.data && 'data' in response.data) {
          pageData = (response.data as any).data
        }
        // Si response.data tiene directamente las propiedades de Page
        else if ('id' in response.data && 'slug' in response.data) {
          pageData = response.data as any
        }
        // Si response.data ES el objeto PageExpanded directo
        else if (typeof response.data === 'object' && response.data !== null) {
          pageData = response.data as any
        }
        else {
          console.error('❌ Error cargando página: Estructura de respuesta inválida')
          toast.error('Estructura de respuesta inválida')
          return
        }

        // Cargar datos básicos
        setTitulo(pageData.title ?? '')
        setDescripcion(pageData.meta_description ?? '')
        
        // Convertir fechas ISO a formato YYYY-MM-DD para inputs tipo date
        if (pageData.valid_from) {
          const date = new Date(pageData.valid_from)
          setFechaInicio(date.toISOString().split('T')[0])
        }
        if (pageData.valid_until) {
          const date = new Date(pageData.valid_until)
          setFechaFin(date.toISOString().split('T')[0])
        }
        
        setIsActive(pageData.is_active ?? false)

        // Cargar título y descripción de sección de productos
        setProductSectionsTitle(pageData.products_section_title ?? '')
        setProductSectionsDescription(pageData.products_section_description ?? '')

        // Cargar secciones de productos
        if (pageData.sections && pageData.sections.length > 0) {
          setProductSections(pageData.sections.map((s: ProductSectionDTO) => ({
            id: s.id,
            name: s.name,
            products: s.product_card_ids || s.product_ids || [],
          })))
        }

        // Cargar info sections si existen
        if (pageData.info_sections && pageData.info_sections.length > 0) {
          setInfoSectionEnabled(true)
          setInfoItems(pageData.info_sections.map((info: InfoSection) => ({
            id: info.id || crypto.randomUUID(),
            title: info.title,
            linkUrl: '', // InfoSection del backend no tiene linkUrl
          })))
        }

        // Cargar banners si existen
        if (pageData.banners && pageData.banners.length > 0) {
          setBannersEnabled(true)
          
          // Mapear banners del backend al formato del formulario
          const mappedBanners = pageData.banners.map((banner, index) => {
            // Parsear posiciones si vienen como strings JSON
            let positionDesktop = { x: 10, y: 50 }
            let positionMobile = { x: 10, y: 50 }

            if (banner.position_desktop) {
              try {
                positionDesktop = typeof banner.position_desktop === 'string'
                  ? JSON.parse(banner.position_desktop)
                  : banner.position_desktop
              } catch (error) {
                console.error('Error parseando position_desktop:', error)
              }
            }

            if (banner.position_mobile) {
              try {
                positionMobile = typeof banner.position_mobile === 'string'
                  ? JSON.parse(banner.position_mobile)
                  : banner.position_mobile
              } catch (error) {
                console.error('Error parseando position_mobile:', error)
              }
            }

            return {
              id: banner.id,
              data: {
                id: banner.id,
                name: banner.name,
                placement: banner.placement,
                link_url: banner.link_url || '',
                title: banner.title || '',
                description: banner.description || '',
                cta: banner.cta || '',
                color_font: banner.color_font || '#000000',
                coordinates: banner.coordinates || '',
                coordinates_mobile: banner.coordinates_mobile || '',
                desktop_image_url: banner.desktop_image_url || undefined,
                mobile_image_url: banner.mobile_image_url || undefined,
                desktop_video_url: banner.desktop_video_url || undefined,
                mobile_video_url: banner.mobile_video_url || undefined,
              },
              files: {}, // Los archivos ya existen en el servidor
              textStyles: typeof banner.text_styles === 'string'
                ? JSON.parse(banner.text_styles)
                : banner.text_styles || DEFAULT_TEXT_STYLES,
              positionDesktop,
              positionMobile,
            }
          })
          
          setBanners(mappedBanners)
          if (mappedBanners.length > 0) {
            setActiveBannerId(mappedBanners[0].id)
          }
        } else if (pageData.banner_ids && pageData.banner_ids.length > 0) {
          // FALLBACK: Si no vinieron expandidos, el backend debe expandirlos
          // TODO: Implementar carga de banners por IDs si el backend no los expande
        }

        // Cargar product cards al contexto si existen
        if (pageData.product_cards && pageData.product_cards.length > 0) {
          // Limpiar contexto antes de cargar (en modo edición)
          clearAll()
          
          // Agrupar product cards por sección
          const cardsBySection = new Map<string, ProductCard[]>()
          
          for (const card of pageData.product_cards) {
            // Buscar en qué sección está este product card
            const section = pageData.sections.find(s => 
              (s.product_card_ids || s.product_ids || []).includes(card.id)
            )
            
            if (section) {
              if (!cardsBySection.has(section.id)) {
                cardsBySection.set(section.id, [])
              }
              cardsBySection.get(section.id)!.push(card)
            }
          }
          
          // Cargar cada grupo de cards al contexto
          cardsBySection.forEach((cards, sectionId) => {
            loadExistingCards(cards, sectionId)
          })
        }

        // Cargar FAQs si existen
        if (pageData.faqs && pageData.faqs.length > 0) {
          setFaqEnabled(true)
          setFaqItems(pageData.faqs.map((faq) => ({
            id: faq.id,
            question: faq.pregunta,
            answer: faq.respuesta,
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
      
      // 1. Preparar banners: separar nuevos de existentes
      const newBanners: NewBanner[] = []
      const existingBannerIds: string[] = []
      const bannerUpdates: BannerUpdate[] = []
      const bannerFiles: ApiBannerFiles[] = []

      if (bannersEnabled) {
        banners.forEach((banner) => {
          // Si el banner tiene un ID que no es temporal (no empieza con "banner-"), es existente
          const isExistingBanner = pageId && banner.data.id && !banner.data.id.startsWith('banner-')

          if (isExistingBanner) {
            // Banner existente: guardar su ID
            existingBannerIds.push(banner.data.id)

            // ✅ ENVIAR ACTUALIZACIONES DE POSICIÓN (esto resuelve el bug del drag & drop)
            bannerUpdates.push({
              id: banner.data.id,
              position_desktop: banner.positionDesktop,
              position_mobile: banner.positionMobile,
              text_styles: banner.textStyles as unknown as Record<string, unknown>,
              title: banner.data.title,
              description: banner.data.description,
              cta: banner.data.cta,
              color_font: banner.data.color_font,
              link_url: banner.data.link_url,
              coordinates: banner.data.coordinates,
              coordinates_mobile: banner.data.coordinates_mobile,
            })

            // ✅ Agregar archivos con referencia al banner ID (igual que en edición individual)
            const hasNewFiles = !!(banner.files.desktop_image || banner.files.mobile_image ||
                                   banner.files.desktop_video || banner.files.mobile_video)

            if (hasNewFiles) {
              bannerFiles.push({
                banner_id: banner.data.id, // Referencia al banner existente
                desktop_image: banner.files.desktop_image,
                mobile_image: banner.files.mobile_image,
                desktop_video: banner.files.desktop_video,
                mobile_video: banner.files.mobile_video,
              })
            }

            // También agregar URLs existentes (igual que en edición individual)
            if (hasNewFiles) {
              // Si hay archivos nuevos, también necesitamos las URLs existentes para los que NO se cambien
              const existingUrls: any = {}
              if (!banner.files.desktop_image && banner.data.desktop_image_url) {
                existingUrls.desktop_image_url = banner.data.desktop_image_url
              }
              if (!banner.files.mobile_image && banner.data.mobile_image_url) {
                existingUrls.mobile_image_url = banner.data.mobile_image_url
              }
              if (!banner.files.desktop_video && banner.data.desktop_video_url) {
                existingUrls.desktop_video_url = banner.data.desktop_video_url
              }
              if (!banner.files.mobile_video && banner.data.mobile_video_url) {
                existingUrls.mobile_video_url = banner.data.mobile_video_url
              }
              // Agregar las URLs existentes al objeto de archivos
              Object.assign(bannerFiles[bannerFiles.length - 1], existingUrls)
            }
          } else {
            // Banner nuevo: agregar a newBanners
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
          }
        })
      }
      
      // 2. Preparar FAQs: separar nuevos de existentes
      const newFaqs: PageFAQ[] = []
      const existingFaqIds: string[] = []
      
      if (faqEnabled) {
        faqItems.forEach((faq, index) => {
          // Si el FAQ tiene ID, es existente
          if (pageId && faq.id && !faq.id.startsWith('faq-')) {
            existingFaqIds.push(faq.id)
          } else {
            // FAQ nuevo
            newFaqs.push({
              pregunta: faq.question,
              respuesta: faq.answer,
              activo: true,
              categoria: "Ofertas",
              prioridad: index + 1,
            })
          }
        })
      }
      
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
            product_card_ids: section.products,
          })),
          products_section_title: productSectionsTitle.trim() || undefined,
          products_section_description: productSectionsDescription.trim() || undefined,
          info_sections: infoSections,
          meta_title: titulo,
          meta_description: descripcion,
          category: "Ofertas",
          is_public: true,
          is_active: isActive,
        },
        new_banners: newBanners,
        existing_banner_ids: existingBannerIds,
        banner_updates: bannerUpdates.length > 0 ? bannerUpdates : undefined, // ✅ Enviar actualizaciones de posición
        new_faqs: newFaqs,
        existing_faq_ids: existingFaqIds,
        banner_files: bannerFiles,
      }
      
      // Log para verificar que se están enviando los campos
      console.log("📤 Enviando request:", {
        pageId,
        products_section_title: request.page.products_section_title,
        products_section_description: request.page.products_section_description,
        sections_count: request.page.sections.length,
        new_banners_count: newBanners.length,
        existing_banner_ids: existingBannerIds,
        banner_updates_count: bannerUpdates.length,
        banner_updates: bannerUpdates, // Ver qué se está enviando exactamente
      })
      
      // 5. Enviar al backend
      // En modo edición, el backend debería actualizar la página existente si se envía el ID
      const response = await pageEndpoints.createComplete(request)
      
      // Extraer el ID de la página creada
      const isDirectPageResponse = response && 'id' in response && 'slug' in response
      let createdPageId: string | null = null
      if (isDirectPageResponse) {
        createdPageId = (response as any).id
      } else if (response.data?.page?.id) {
        createdPageId = response.data.page.id
      }
      
      if (!createdPageId) {
        throw new Error("No se pudo obtener el ID de la página creada")
      }
      
      // 6. Crear product cards si existen
      if (productCards.length > 0) {
        // Mapa para relacionar tempId con ID real
        const cardIdMap = new Map<string, string>()
        
        // Crear cada product card
        for (const card of productCards) {
          try {
            const formData = new FormData()
            formData.append("page_id", createdPageId)
            formData.append("title", card.title)
            if (card.subtitle) formData.append("subtitle", card.subtitle)
            if (card.description) formData.append("description", card.description)
            if (card.cta_text) formData.append("cta_text", card.cta_text)
            if (card.cta_url) formData.append("cta_url", card.cta_url)
            if (card.image) formData.append("image", card.image)
            if (card.image_url) formData.append("image_url", card.image_url)
            
            const createdCard = await productCardEndpoints.create(formData)
            const realCardId = createdCard.data?.id || (createdCard as any).id
            
            if (realCardId) {
              cardIdMap.set(card.tempId, realCardId)
            }
          } catch (error) {
            console.error(`❌ Error creando product card "${card.title}":`, error)
            // Continuar con las demás aunque una falle
          }
        }
        
        // 7. Actualizar secciones con los IDs reales de product cards
        if (cardIdMap.size > 0) {
          const updatedSections = productSections.map(section => {
            // Obtener los product cards de esta sección del contexto
            const sectionCards = productCards.filter(card => card.sectionId === section.id)
            
            // Mapear los IDs temporales a IDs reales
            const realIds = sectionCards
              .map(card => cardIdMap.get(card.tempId))
              .filter(id => id !== undefined) as string[]
            
            return {
              id: section.id,
              name: section.name,
              order: productSections.indexOf(section) + 1,
              product_card_ids: realIds,
            }
          })
          
          // Actualizar la página con las secciones correctas
          try {
            await pageEndpoints.update(createdPageId, {
              sections: updatedSections,
            })
          } catch (error) {
            console.error("❌ Error actualizando secciones:", error)
            toast.warning("Página creada pero hubo un problema al relacionar los productos")
          }
        }
        
        // Limpiar el contexto de product cards
        clearAll()
      }
      
      // Validar éxito
      const isSuccess = 
        response.success === true || // Formato completo con success
        (response.success !== false && response.data && response.data.page) || // Formato completo sin success pero con data
        isDirectPageResponse // Formato directo (el backend retornó el Page directamente)
      
      if (isSuccess) {
        toast.success("Oferta creada exitosamente")
        router.push(returnPath)
      } else {
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
