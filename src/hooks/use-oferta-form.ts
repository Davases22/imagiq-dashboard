import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BannerTextStyles, BannerPosition } from "@/types/banner"

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
  const router = useRouter()
  const [saving, setSaving] = useState(false)

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

    if (!isFormValid()) {
      toast.error("Por favor completa todos los campos requeridos correctamente")
      return
    }

    setSaving(true)
    try {
      // TODO: Implementar llamada a API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Oferta creada exitosamente")
      router.push("/pagina-web/ofertas")
    } catch (error) {
      console.error("Error creating oferta:", error)
      toast.error("Error al crear la oferta")
    } finally {
      setSaving(false)
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
