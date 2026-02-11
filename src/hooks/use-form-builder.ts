import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ContentBlock } from "@/types/banner"
import { pageEndpoints } from "@/lib/api"
import type {
  CreateCompletePageRequest,
  NewBanner,
  PageFAQ,
  BannerFiles as ApiBannerFiles,
  PageExpanded,
  BannerUpdate
} from "@/types/page"
import type {
  FormFieldDefinition,
  FormFieldType,
  FormConfig,
  FormLayout,
  FormSuccessConfig,
  FORM_FIELD_TYPE_LABELS
} from "@/types/form-page"
import { useAuth } from "@/contexts/AuthContext"

interface BannerData {
  id: string
  name: string
  placement: string
  link_url: string
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
  contentBlocks: ContentBlock[]
}

interface FaqItem {
  id: string
  question: string
  answer: string
}

interface UseFormBuilderOptions {
  pageId?: string
  returnPath?: string
}

export function useFormBuilder(options: UseFormBuilderOptions = {}) {
  const { pageId, returnPath = "/pagina-web/formularios" } = options
  const { user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(!!pageId)

  // Estados básicos de página
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
        placement: "formularios-banner_top",
        link_url: "",
      },
      files: {},
      contentBlocks: [],
    },
  ])
  const [activeBannerId, setActiveBannerId] = useState("banner-1")

  // Estados de FAQ
  const [faqEnabled, setFaqEnabled] = useState(false)
  const [faqItems, setFaqItems] = useState<FaqItem[]>([])

  // Estados específicos de formulario
  const [formFields, setFormFields] = useState<FormFieldDefinition[]>([])
  const [formLayout, setFormLayout] = useState<FormLayout>({
    type: "banner_top",
    form_max_width: "600px",
    background_color: "#ffffff",
    form_background_color: "#ffffff",
  })
  const [formSuccessConfig, setFormSuccessConfig] = useState<FormSuccessConfig>({
    type: "message",
    message: "¡Gracias! Tu respuesta ha sido enviada exitosamente.",
  })
  const [submitButtonText, setSubmitButtonText] = useState("Enviar")

  const activeBanner = banners.find((b) => b.id === activeBannerId)

  // Derivar placement del layout (para que BANNER_SPECS resuelva dimensiones correctas)
  const bannerPlacement = `formularios-${formLayout.type}`

  // Actualizar placement en todos los banners cuando cambia el layout
  useEffect(() => {
    setBanners(prev => prev.map(b => ({
      ...b,
      data: { ...b.data, placement: bannerPlacement }
    })))
  }, [bannerPlacement])

  // Handlers básicos
  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case "titulo":
        setTitulo(value)
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

  const handleBannersChange = (updatedBanners: Array<{ id: string; data: BannerData; files: BannerFiles; contentBlocks: ContentBlock[] }>) => {
    setBanners(prev =>
      updatedBanners.map(ub => {
        const existing = prev.find(p => p.id === ub.id)
        return existing
          ? { ...existing, ...ub, data: { ...ub.data, placement: bannerPlacement } }
          : { ...ub, data: { ...ub.data, placement: bannerPlacement }, contentBlocks: ub.contentBlocks }
      })
    )
  }

  // Handlers de form fields
  const addFormField = (type: FormFieldType) => {
    const LABELS: Record<FormFieldType, string> = {
      text: "Texto",
      email: "Correo electrónico",
      phone: "Teléfono",
      textarea: "Texto largo",
      select: "Lista desplegable",
      checkbox: "Casilla de verificación",
      radio: "Opción múltiple",
      number: "Número",
      date: "Fecha",
      address: "Dirección",
    }

    const newField: FormFieldDefinition = {
      id: `field-${Date.now()}`,
      type,
      label: LABELS[type],
      placeholder: "",
      required: false,
      order: formFields.length,
      options: ["select", "radio", "checkbox"].includes(type) ? ["Opción 1"] : undefined,
      width: "full",
    }
    setFormFields(prev => [...prev, newField])
  }

  const removeFormField = (fieldId: string) => {
    setFormFields(prev => prev.filter(f => f.id !== fieldId).map((f, i) => ({ ...f, order: i })))
  }

  const updateFormField = (fieldId: string, updates: Partial<FormFieldDefinition>) => {
    setFormFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f))
  }

  const reorderFormFields = (reordered: FormFieldDefinition[]) => {
    setFormFields(reordered.map((f, i) => ({ ...f, order: i })))
  }

  // Validación del formulario
  const isFormValid = useMemo(() => {
    if (!titulo.trim()) return false
    if (formFields.length === 0) return false
    if (formFields.some(f => !f.label.trim())) return false
    if (formSuccessConfig.type === "redirect" && !formSuccessConfig.redirect_url?.trim()) return false
    return true
  }, [titulo, formFields, formSuccessConfig])

  // Cargar datos existentes si estamos en modo edición
  useEffect(() => {
    if (!pageId) return

    const loadPageData = async () => {
      try {
        setLoading(true)
        const response = await pageEndpoints.getById(pageId, ['banners', 'faqs'])

        // Verificar si la respuesta tiene la estructura esperada
        if (!response || !response.data) {
          console.error('Error cargando página: Respuesta vacía del API')
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
          console.error('Error cargando página: Estructura de respuesta inválida')
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

        // Cargar configuración del formulario
        if (pageData.form_config) {
          const config = typeof pageData.form_config === 'string'
            ? JSON.parse(pageData.form_config)
            : pageData.form_config

          setFormFields(config.fields || [])
          setSubmitButtonText(config.submit_button_text || "Enviar")
        }

        // Cargar layout del formulario
        if (pageData.form_layout) {
          const layout = typeof pageData.form_layout === 'string'
            ? JSON.parse(pageData.form_layout)
            : pageData.form_layout

          setFormLayout(layout)
        }

        // Cargar configuración de éxito
        if (pageData.form_success_config) {
          const successConfig = typeof pageData.form_success_config === 'string'
            ? JSON.parse(pageData.form_success_config)
            : pageData.form_success_config

          setFormSuccessConfig(successConfig)
        }

        // Cargar banners si existen
        if (pageData.banners && pageData.banners.length > 0) {
          setBannersEnabled(true)

          // Mapear banners del backend al formato del formulario
          const mappedBanners = pageData.banners.map((banner) => {
            // Parsear content_blocks si existe
            let contentBlocks: ContentBlock[] = []
            if (banner.content_blocks) {
              try {
                contentBlocks = typeof banner.content_blocks === 'string'
                  ? JSON.parse(banner.content_blocks)
                  : banner.content_blocks
              } catch (error) {
                console.error('Error parseando content_blocks:', error)
              }
            }

            return {
              id: banner.id,
              data: {
                id: banner.id,
                name: banner.name,
                placement: banner.placement,
                link_url: banner.link_url || '',
                desktop_image_url: banner.desktop_image_url || undefined,
                mobile_image_url: banner.mobile_image_url || undefined,
                desktop_video_url: banner.desktop_video_url || undefined,
                mobile_video_url: banner.mobile_video_url || undefined,
              },
              files: {}, // Los archivos ya existen en el servidor
              contentBlocks,
            }
          })

          setBanners(mappedBanners)
          if (mappedBanners.length > 0) {
            setActiveBannerId(mappedBanners[0].id)
          }
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
        console.error('Error cargando página:', error)
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

    if (!isFormValid) {
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

            // Enviar actualizaciones (content_blocks y link_url)
            bannerUpdates.push({
              id: banner.data.id,
              content_blocks: JSON.stringify(banner.contentBlocks),
              link_url: banner.data.link_url,
            })

            // Agregar archivos con referencia al banner ID
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

            // También agregar URLs existentes
            if (hasNewFiles) {
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
              content_blocks: JSON.stringify(banner.contentBlocks),
              link_url: banner.data.link_url,
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
              categoria: "Formularios",
              prioridad: index + 1,
            })
          }
        })
      }

      // 3. Construir form_config
      const formConfig: FormConfig = {
        fields: formFields,
        submit_button_text: submitButtonText,
        submit_button_style: {
          background_color: "#000000",
          text_color: "#ffffff",
          border_radius: "8px",
        },
      }

      // 4. Construir request
      const pagePayload: any = {
        ...(pageId && { id: pageId }), // Incluir id solo si estamos editando
        slug,
        title: titulo,
        status: "published",
        created_by: user?.email || "unknown@imagiq.com",
        valid_from: fechaInicio || undefined,
        valid_until: fechaFin || undefined,
        meta_title: titulo,
        meta_description: descripcion,
        category: "Formularios",
        is_public: true,
        is_active: isActive,
        page_type: "form",
        form_config: formConfig,
        form_layout: formLayout,
        form_success_config: formSuccessConfig,
        sections: [], // Formularios no usan secciones de productos
      }

      const request: CreateCompletePageRequest = {
        page: pagePayload,
        new_banners: newBanners,
        existing_banner_ids: existingBannerIds,
        banner_updates: bannerUpdates.length > 0 ? bannerUpdates : undefined,
        new_faqs: newFaqs,
        existing_faq_ids: existingFaqIds,
        banner_files: bannerFiles,
      }

      // Log para verificar que se están enviando los campos
      console.log("Enviando request:", {
        pageId,
        page_type: request.page.page_type,
        form_fields_count: formFields.length,
        form_layout_type: formLayout.type,
        success_config_type: formSuccessConfig.type,
        new_banners_count: newBanners.length,
        existing_banner_ids: existingBannerIds,
        banner_updates_count: bannerUpdates.length,
      })

      // 5. Enviar al backend
      const response = await pageEndpoints.createComplete(request)

      // Validar éxito
      const isDirectPageResponse = response && 'id' in response && 'slug' in response
      const isSuccess =
        response.success === true || // Formato completo con success
        (response.success !== false && response.data && response.data.page) || // Formato completo sin success pero con data
        isDirectPageResponse // Formato directo (el backend retornó el Page directamente)

      if (isSuccess) {
        toast.success(pageId ? "Formulario actualizado exitosamente" : "Formulario creado exitosamente")
        router.push(returnPath)
      } else {
        toast.error(response.message || "Error al guardar el formulario")
      }
    } catch (error) {
      console.error("Error en el proceso:", error)

      // Si el error es de red o timeout, la página pudo haberse creado
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('Network') ||
        errorMessage.includes('timeout')) {
        toast.error(
          "Error de conexión. El formulario pudo haberse creado. Verifica en la lista de formularios.",
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
    // Campos básicos de página
    titulo,
    descripcion,
    fechaInicio,
    fechaFin,
    isActive,
    setIsActive,

    // Form fields
    formFields,
    formLayout,
    formSuccessConfig,
    submitButtonText,

    // Banners
    bannersEnabled,
    setBannersEnabled,
    banners,
    activeBannerId,
    setActiveBannerId,
    activeBanner,

    // FAQs
    faqEnabled,
    setFaqEnabled,
    faqItems,
    setFaqItems,

    // Handlers básicos
    handleFieldChange,
    handleBannersChange,

    // Handlers de form fields
    addFormField,
    removeFormField,
    updateFormField,
    reorderFormFields,

    // Handlers de configuración
    setFormLayout,
    setFormSuccessConfig,
    setSubmitButtonText,

    // Submit & UI
    handleSubmit,
    handleCancel,
    loading,
    saving,
    isFormValid,
  }
}
