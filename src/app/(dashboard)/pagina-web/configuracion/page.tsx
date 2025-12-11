"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { LogoUpload } from "@/components/logo/logo-upload"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const API_KEY = process.env.NEXT_PUBLIC_API_KEY

interface Logo {
  id: string
  name: "header-logo-dark" | "header-logo-light" | "favicon"
  image_url: string | null
  alt_text: string
  width: number
  height: number
}

type LogoType = "header-logo-dark" | "header-logo-light" | "favicon"

export default function ConfiguracionPage() {
  const router = useRouter()

  // Estados para header-logo-dark
  const [headerLogoDark, setHeaderLogoDark] = useState<Logo | null>(null)
  const [headerDarkPreview, setHeaderDarkPreview] = useState<string | null>(null)
  const [headerDarkFile, setHeaderDarkFile] = useState<File | null>(null)
  const [isUploadingHeaderDark, setIsUploadingHeaderDark] = useState(false)

  // Estados para header-logo-light
  const [headerLogoLight, setHeaderLogoLight] = useState<Logo | null>(null)
  const [headerLightPreview, setHeaderLightPreview] = useState<string | null>(null)
  const [headerLightFile, setHeaderLightFile] = useState<File | null>(null)
  const [isUploadingHeaderLight, setIsUploadingHeaderLight] = useState(false)

  // Estados para favicon
  const [favicon, setFavicon] = useState<Logo | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)

  const [isLoading, setIsLoading] = useState(true)

  // Cargar logos existentes al montar el componente
  useEffect(() => {
    loadLogos()
  }, [])

  const loadLogos = async () => {
    try {
      setIsLoading(true)

      // Cargar header-logo-dark
      const headerDarkResponse = await fetch(`${API_URL}/api/multimedia/logo/header-logo-dark`)
      if (headerDarkResponse.ok) {
        const headerDarkData = await headerDarkResponse.json()
        if (headerDarkData && headerDarkData.image_url) {
          setHeaderLogoDark(headerDarkData)
          setHeaderDarkPreview(headerDarkData.image_url)
        }
      }

      // Cargar header-logo-light
      const headerLightResponse = await fetch(`${API_URL}/api/multimedia/logo/header-logo-light`)
      if (headerLightResponse.ok) {
        const headerLightData = await headerLightResponse.json()
        if (headerLightData && headerLightData.image_url) {
          setHeaderLogoLight(headerLightData)
          setHeaderLightPreview(headerLightData.image_url)
        }
      }

      // Cargar favicon
      const faviconResponse = await fetch(`${API_URL}/api/multimedia/logo/favicon`)
      if (faviconResponse.ok) {
        const faviconData = await faviconResponse.json()
        if (faviconData && faviconData.image_url) {
          setFavicon(faviconData)
          setFaviconPreview(faviconData.image_url)
        }
      }
    } catch (error) {
      console.error("Error loading logos:", error)
      toast.error("Error al cargar los logos")
    } finally {
      setIsLoading(false)
    }
  }

  // Validar archivo
  const validateFile = (file: File, logoType: LogoType) => {
    const validTypes = logoType === "favicon"
      ? ["image/jpeg", "image/png", "image/webp", "image/x-icon", "image/svg+xml"]
      : ["image/jpeg", "image/png", "image/webp", "image/svg+xml"]

    if (!validTypes.includes(file.type)) {
      toast.error("Formato no válido. Usa JPG, PNG, WebP o SVG")
      return false
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar 2MB")
      return false
    }

    return true
  }

  // Handler para header-logo-dark
  const handleHeaderDarkImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !validateFile(file, "header-logo-dark")) return

    setHeaderDarkFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setHeaderDarkPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveHeaderDarkImage = () => {
    setHeaderDarkFile(null)
    setHeaderDarkPreview(headerLogoDark?.image_url || null)
  }

  const handleUploadHeaderDark = async () => {
    if (!headerDarkFile) {
      toast.error("Por favor selecciona una imagen primero")
      return
    }

    try {
      setIsUploadingHeaderDark(true)

      const formData = new FormData()
      formData.append("image", headerDarkFile)

      const response = await fetch(`${API_URL}/api/multimedia/logo/upload/header-logo-dark`, {
        method: "POST",
        headers: {
          ...(API_KEY && { "X-API-Key": API_KEY }),
        },
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al subir el logo")
      }

      const data = await response.json()
      setHeaderLogoDark(data.logo)
      setHeaderDarkPreview(data.url)
      setHeaderDarkFile(null)
      toast.success("Logo oscuro actualizado correctamente")
    } catch (error) {
      console.error("Error uploading header-logo-dark:", error)
      toast.error(error instanceof Error ? error.message : "Error al subir el logo")
    } finally {
      setIsUploadingHeaderDark(false)
    }
  }

  // Handler para header-logo-light
  const handleHeaderLightImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !validateFile(file, "header-logo-light")) return

    setHeaderLightFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setHeaderLightPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveHeaderLightImage = () => {
    setHeaderLightFile(null)
    setHeaderLightPreview(headerLogoLight?.image_url || null)
  }

  const handleUploadHeaderLight = async () => {
    if (!headerLightFile) {
      toast.error("Por favor selecciona una imagen primero")
      return
    }

    try {
      setIsUploadingHeaderLight(true)

      const formData = new FormData()
      formData.append("image", headerLightFile)

      const response = await fetch(`${API_URL}/api/multimedia/logo/upload/header-logo-light`, {
        method: "POST",
        headers: {
          ...(API_KEY && { "X-API-Key": API_KEY }),
        },
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al subir el logo")
      }

      const data = await response.json()
      setHeaderLogoLight(data.logo)
      setHeaderLightPreview(data.url)
      setHeaderLightFile(null)
      toast.success("Logo claro actualizado correctamente")
    } catch (error) {
      console.error("Error uploading header-logo-light:", error)
      toast.error(error instanceof Error ? error.message : "Error al subir el logo")
    } finally {
      setIsUploadingHeaderLight(false)
    }
  }

  // Handler para favicon
  const handleFaviconImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !validateFile(file, "favicon")) return

    setFaviconFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setFaviconPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveFaviconImage = () => {
    setFaviconFile(null)
    setFaviconPreview(favicon?.image_url || null)
  }

  const handleUploadFavicon = async () => {
    if (!faviconFile) {
      toast.error("Por favor selecciona una imagen primero")
      return
    }

    try {
      setIsUploadingFavicon(true)

      const formData = new FormData()
      formData.append("image", faviconFile)

      const response = await fetch(`${API_URL}/api/multimedia/logo/upload/favicon`, {
        method: "POST",
        headers: {
          ...(API_KEY && { "X-API-Key": API_KEY }),
        },
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al subir el favicon")
      }

      const data = await response.json()
      setFavicon(data.logo)
      setFaviconPreview(data.url)
      setFaviconFile(null)
      toast.success("Favicon actualizado correctamente")
    } catch (error) {
      console.error("Error uploading favicon:", error)
      toast.error(error instanceof Error ? error.message : "Error al subir el favicon")
    } finally {
      setIsUploadingFavicon(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push("/pagina-web")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Configuración General
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los logos y favicon de tu sitio web
          </p>
        </div>
      </div>

      {/* Grid de logos */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Header Logo Dark (para fondos claros) */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Oscuro</CardTitle>
            <CardDescription>
              Para fondos claros - se muestra cuando el header es blanco
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LogoUpload
              name="header-logo-dark"
              imagePreview={headerDarkPreview}
              onImageChange={handleHeaderDarkImageChange}
              onRemoveImage={handleRemoveHeaderDarkImage}
              isUploading={isUploadingHeaderDark}
              disabled={isUploadingHeaderDark}
              recommendedSize="512 x 512 px"
              description="Formatos: JPG, PNG, WebP o SVG. Máximo 2MB."
            />

            {headerDarkFile && (
              <Button
                onClick={handleUploadHeaderDark}
                disabled={isUploadingHeaderDark}
                className="w-full"
              >
                {isUploadingHeaderDark ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Logo
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Header Logo Light (para fondos oscuros) */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Claro</CardTitle>
            <CardDescription>
              Para fondos oscuros - se muestra cuando el header es negro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LogoUpload
              name="header-logo-light"
              imagePreview={headerLightPreview}
              onImageChange={handleHeaderLightImageChange}
              onRemoveImage={handleRemoveHeaderLightImage}
              isUploading={isUploadingHeaderLight}
              disabled={isUploadingHeaderLight}
              recommendedSize="512 x 512 px"
              description="Formatos: JPG, PNG, WebP o SVG. Máximo 2MB."
            />

            {headerLightFile && (
              <Button
                onClick={handleUploadHeaderLight}
                disabled={isUploadingHeaderLight}
                className="w-full"
              >
                {isUploadingHeaderLight ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Logo
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Favicon */}
        <Card>
          <CardHeader>
            <CardTitle>Favicon</CardTitle>
            <CardDescription>
              Este icono aparece en la pestaña del navegador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LogoUpload
              name="favicon"
              imagePreview={faviconPreview}
              onImageChange={handleFaviconImageChange}
              onRemoveImage={handleRemoveFaviconImage}
              isUploading={isUploadingFavicon}
              disabled={isUploadingFavicon}
              recommendedSize="64 x 64 px"
              description="Formatos: ICO, PNG, JPG, WebP o SVG. Máximo 2MB."
            />

            {faviconFile && (
              <Button
                onClick={handleUploadFavicon}
                disabled={isUploadingFavicon}
                className="w-full"
              >
                {isUploadingFavicon ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Favicon
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
