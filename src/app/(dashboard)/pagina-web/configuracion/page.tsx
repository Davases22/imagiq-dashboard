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
  name: "header-logo" | "favicon"
  image_url: string | null
  alt_text: string
  width: number
  height: number
}

export default function ConfiguracionPage() {
  const router = useRouter()

  // Estados para header-logo
  const [headerLogo, setHeaderLogo] = useState<Logo | null>(null)
  const [headerPreview, setHeaderPreview] = useState<string | null>(null)
  const [headerFile, setHeaderFile] = useState<File | null>(null)
  const [isUploadingHeader, setIsUploadingHeader] = useState(false)

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

      // Cargar header-logo
      const headerResponse = await fetch(`${API_URL}/api/multimedia/logo/header-logo`)
      if (headerResponse.ok) {
        const headerData = await headerResponse.json()
        if (headerData && headerData.image_url) {
          setHeaderLogo(headerData)
          setHeaderPreview(headerData.image_url)
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

  // Handler para header-logo
  const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"]
    if (!validTypes.includes(file.type)) {
      toast.error("Formato no válido. Usa JPG, PNG, WebP o SVG")
      return
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar 2MB")
      return
    }

    setHeaderFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setHeaderPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveHeaderImage = () => {
    setHeaderFile(null)
    setHeaderPreview(headerLogo?.image_url || null)
  }

  const handleUploadHeader = async () => {
    if (!headerFile) {
      toast.error("Por favor selecciona una imagen primero")
      return
    }

    try {
      setIsUploadingHeader(true)

      const formData = new FormData()
      formData.append("image", headerFile)

      const response = await fetch(`${API_URL}/api/multimedia/logo/upload/header-logo`, {
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
      setHeaderLogo(data.logo)
      setHeaderPreview(data.url)
      setHeaderFile(null)
      toast.success("Logo del header actualizado correctamente")
    } catch (error) {
      console.error("Error uploading header logo:", error)
      toast.error(error instanceof Error ? error.message : "Error al subir el logo")
    } finally {
      setIsUploadingHeader(false)
    }
  }

  // Handler para favicon
  const handleFaviconImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/x-icon", "image/svg+xml"]
    if (!validTypes.includes(file.type)) {
      toast.error("Formato no válido. Usa ICO, PNG, JPG, WebP o SVG")
      return
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar 2MB")
      return
    }

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
            Gestiona el logo y favicon de tu sitio web
          </p>
        </div>
      </div>

      {/* Grid de logos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Header Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Logo del Header</CardTitle>
            <CardDescription>
              Este logo aparece en el encabezado de tu sitio web
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LogoUpload
              name="header-logo"
              imagePreview={headerPreview}
              onImageChange={handleHeaderImageChange}
              onRemoveImage={handleRemoveHeaderImage}
              isUploading={isUploadingHeader}
              disabled={isUploadingHeader}
              recommendedSize="512 x 512 px"
              description="Formatos: JPG, PNG, WebP o SVG. Máximo 2MB."
            />

            {headerFile && (
              <Button
                onClick={handleUploadHeader}
                disabled={isUploadingHeader}
                className="w-full"
              >
                {isUploadingHeader ? (
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
