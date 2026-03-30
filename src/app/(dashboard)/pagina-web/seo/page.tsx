"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Loader2, Globe, Bot, Map, FileText, Plus, X, ExternalLink, Copy, Upload, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { SerpPreview } from "@/components/seo/SerpPreview"
import { OgPreview } from "@/components/seo/OgPreview"
import { CharCounter } from "@/components/seo/CharCounter"
import { RobotsPreview } from "@/components/seo/RobotsPreview"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const API_KEY = process.env.NEXT_PUBLIC_API_KEY

type AiPolicy = "allow_all" | "block_training" | "block_all"

interface SeoSettings {
  [key: string]: string | null
}

export default function SeoPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SeoSettings>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Parsed values for UI
  const disallowPaths: string[] = (() => {
    try { return JSON.parse(settings.robots_disallow_paths || "[]") } catch { return [] }
  })()
  const socialProfiles: string[] = (() => {
    try { return JSON.parse(settings.social_profiles || "[]") } catch { return [] }
  })()
  const aiPolicy = (settings.ai_crawlers_policy || "block_training") as AiPolicy
  const allowIndexing = settings.allow_indexing !== "false"
  const sitemapEnabled = settings.sitemap_enabled !== "false"

  const [newPath, setNewPath] = useState("")
  const [newProfile, setNewProfile] = useState("")
  const [isUploadingOg, setIsUploadingOg] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_URL}/api/multimedia/seo/settings`, {
        headers: { ...(API_KEY && { "X-API-Key": API_KEY }) },
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (err) {
      toast.error("Error al cargar configuracion SEO")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const updateField = (key: string, value: string | null) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const saveSettings = async () => {
    try {
      setIsSaving(true)
      const res = await fetch(`${API_URL}/api/multimedia/seo/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY && { "X-API-Key": API_KEY }),
        },
        body: JSON.stringify({ settings }),
      })
      if (res.ok) {
        toast.success("Configuracion SEO guardada")
        setHasChanges(false)
      } else {
        toast.error("Error al guardar")
      }
    } catch {
      toast.error("Error de conexion")
    } finally {
      setIsSaving(false)
    }
  }

  const addDisallowPath = () => {
    if (!newPath.trim()) return
    const path = newPath.startsWith("/") ? newPath.trim() : `/${newPath.trim()}`
    const updated = [...disallowPaths, path]
    updateField("robots_disallow_paths", JSON.stringify(updated))
    setNewPath("")
  }

  const removeDisallowPath = (index: number) => {
    const updated = disallowPaths.filter((_, i) => i !== index)
    updateField("robots_disallow_paths", JSON.stringify(updated))
  }

  const addSocialProfile = () => {
    if (!newProfile.trim()) return
    const updated = [...socialProfiles, newProfile.trim()]
    updateField("social_profiles", JSON.stringify(updated))
    setNewProfile("")
  }

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato no valido. Usa JPG, PNG o WebP")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar 2MB")
      return
    }

    try {
      setIsUploadingOg(true)
      const formData = new FormData()
      formData.append("image", file)

      const res = await fetch(`${API_URL}/api/multimedia/logo/upload/header-logo-dark`, {
        method: "POST",
        headers: { ...(API_KEY && { "X-API-Key": API_KEY }) },
        body: formData,
      })

      if (!res.ok) throw new Error("Error al subir imagen")

      const data = await res.json()
      updateField("default_og_image", data.url)
      toast.success("Imagen OG subida correctamente")
    } catch {
      toast.error("Error al subir la imagen")
    } finally {
      setIsUploadingOg(false)
      e.target.value = ""
    }
  }

  const removeSocialProfile = (index: number) => {
    const updated = socialProfiles.filter((_, i) => i !== index)
    updateField("social_profiles", JSON.stringify(updated))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/pagina-web")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SEO y Metadatos</h1>
            <p className="text-sm text-muted-foreground">Optimiza tu sitio para motores de busqueda</p>
          </div>
        </div>
        <Button onClick={saveSettings} disabled={isSaving || !hasChanges}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar cambios
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="robots" className="flex items-center gap-2">
            <Bot className="h-4 w-4" /> Robots
          </TabsTrigger>
          <TabsTrigger value="sitemap" className="flex items-center gap-2">
            <Map className="h-4 w-4" /> Sitemap
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Paginas
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB: General ─── */}
        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
            {/* Left: Edit fields */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuracion general</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nombre del sitio</Label>
                      <Input
                        value={settings.site_name || ""}
                        onChange={e => updateField("site_name", e.target.value)}
                        placeholder="Imagiq Samsung Store"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL del sitio</Label>
                      <Input
                        value={settings.site_url || ""}
                        onChange={e => updateField("site_url", e.target.value)}
                        placeholder="https://imagiq.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Plantilla de titulo</Label>
                    <Input
                      value={settings.title_template || ""}
                      onChange={e => updateField("title_template", e.target.value)}
                      placeholder="%s | Imagiq Samsung Store"
                    />
                    <p className="text-xs text-muted-foreground">Usa %s donde ira el titulo de cada pagina</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Titulo por defecto</Label>
                    <Input
                      value={settings.default_title || ""}
                      onChange={e => updateField("default_title", e.target.value)}
                    />
                    <CharCounter value={settings.default_title || ""} min={30} max={60} label="Titulo" />
                  </div>

                  <div className="space-y-2">
                    <Label>Descripcion por defecto</Label>
                    <Textarea
                      value={settings.default_description || ""}
                      onChange={e => updateField("default_description", e.target.value)}
                      rows={3}
                    />
                    <CharCounter value={settings.default_description || ""} min={120} max={160} label="Descripcion" />
                  </div>

                  {/* OG Image */}
                  <div className="space-y-2">
                    <Label>Imagen para redes sociales (OG Image)</Label>
                    <p className="text-xs text-muted-foreground">Tamano recomendado: 1200x630px. Se muestra al compartir en Facebook, Twitter, WhatsApp, etc.</p>

                    {settings.default_og_image ? (
                      <div className="space-y-3">
                        <div className="relative rounded-lg border overflow-hidden" style={{ aspectRatio: "1200/630" }}>
                          <img
                            src={settings.default_og_image.startsWith("/") ? `${settings.site_url || ""}${settings.default_og_image}` : settings.default_og_image}
                            alt="OG Image preview"
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).src = "" }}
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <label className="cursor-pointer">
                              <Button variant="secondary" size="icon" asChild>
                                <span><ImageIcon className="h-4 w-4" /></span>
                              </Button>
                              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleOgImageUpload} disabled={isUploadingOg} />
                            </label>
                            <Button variant="destructive" size="icon" onClick={() => updateField("default_og_image", "")}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {isUploadingOg && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={settings.default_og_image || ""}
                            onChange={e => updateField("default_og_image", e.target.value)}
                            placeholder="https://res.cloudinary.com/.../og-image.png"
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-accent/50 transition-colors ${isUploadingOg ? "opacity-50 cursor-not-allowed" : ""}`} style={{ aspectRatio: "1200/630" }}>
                          {isUploadingOg ? (
                            <Loader2 className="h-10 w-10 mb-3 animate-spin text-primary" />
                          ) : (
                            <Upload className="h-10 w-10 mb-3 text-muted-foreground" />
                          )}
                          <span className="text-sm text-primary font-medium">{isUploadingOg ? "Subiendo..." : "Click para subir imagen"}</span>
                          <span className="text-xs text-muted-foreground mt-1">JPG, PNG o WebP. Max 2MB</span>
                          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleOgImageUpload} disabled={isUploadingOg} />
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">o pega una URL:</span>
                          <Input
                            value={settings.default_og_image || ""}
                            onChange={e => updateField("default_og_image", e.target.value)}
                            placeholder="https://res.cloudinary.com/.../og-image.png"
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Codigo de verificacion de Google</Label>
                    <Input
                      value={settings.google_verification || ""}
                      onChange={e => updateField("google_verification", e.target.value)}
                      placeholder="google-site-verification=..."
                    />
                  </div>

                  {/* Social Profiles — full URL in badges */}
                  <div className="space-y-2">
                    <Label>Perfiles sociales</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newProfile}
                        onChange={e => setNewProfile(e.target.value)}
                        placeholder="https://www.instagram.com/imagiq_colombia"
                        onKeyDown={e => e.key === "Enter" && addSocialProfile()}
                      />
                      <Button variant="outline" size="icon" onClick={addSocialProfile}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {socialProfiles.map((url, i) => (
                        <Badge key={i} variant="secondary" className="flex items-center gap-1 max-w-full">
                          <span className="truncate text-xs" title={url}>{url}</span>
                          <button onClick={() => removeSocialProfile(i)} className="flex-shrink-0 ml-1">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Previews sticky */}
            <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Vista previa en Google</CardTitle>
                </CardHeader>
                <CardContent>
                  <SerpPreview
                    title={settings.default_title || ""}
                    description={settings.default_description || ""}
                    url={settings.site_url || "https://imagiq.com"}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Vista previa en redes sociales</CardTitle>
                </CardHeader>
                <CardContent>
                  <OgPreview
                    title={settings.default_title || ""}
                    description={settings.default_description || ""}
                    image={settings.default_og_image?.startsWith("/") ? `${settings.site_url || ""}${settings.default_og_image}` : (settings.default_og_image || "")}
                    siteName={settings.site_name || ""}
                    url={settings.site_url || ""}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB: Robots ─── */}
        <TabsContent value="robots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indexacion del sitio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Permitir que Google indexe el sitio</p>
                  <p className="text-sm text-muted-foreground">Si desactivas esto, el sitio no aparecera en Google</p>
                </div>
                <Switch
                  checked={allowIndexing}
                  onCheckedChange={v => updateField("allow_indexing", v ? "true" : "false")}
                />
              </div>

              {/* Disallow Paths */}
              <div className="space-y-2">
                <Label>Rutas bloqueadas para crawlers</Label>
                <p className="text-xs text-muted-foreground">Estas rutas no seran rastreadas por Google ni otros buscadores</p>
                <div className="flex gap-2">
                  <Input
                    value={newPath}
                    onChange={e => setNewPath(e.target.value)}
                    placeholder="/ruta-a-bloquear/"
                    onKeyDown={e => e.key === "Enter" && addDisallowPath()}
                  />
                  <Button variant="outline" size="icon" onClick={addDisallowPath}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {disallowPaths.map((path, i) => (
                    <Badge key={i} variant="outline" className="flex items-center gap-1 font-mono text-xs">
                      {path}
                      <button onClick={() => removeDisallowPath(i)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* AI Policy */}
              <div className="space-y-3">
                <Label>Politica de crawlers de IA</Label>
                <div className="space-y-2">
                  {[
                    { value: "allow_all", label: "Permitir todos", desc: "Google, Bing, ChatGPT, Claude pueden acceder" },
                    { value: "block_training", label: "Bloquear entrenamiento", desc: "Permite busqueda IA, bloquea entrenamiento (GPTBot, CCBot)" },
                    { value: "block_all", label: "Bloquear todos los bots IA", desc: "Solo permite buscadores tradicionales" },
                  ].map(option => (
                    <label key={option.value} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                      <input
                        type="radio"
                        name="ai_policy"
                        value={option.value}
                        checked={aiPolicy === option.value}
                        onChange={() => updateField("ai_crawlers_policy", option.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-sm">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Robots Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vista previa de robots.txt</CardTitle>
              <CardDescription>Este es el archivo que veran los crawlers</CardDescription>
            </CardHeader>
            <CardContent>
              <RobotsPreview
                disallowPaths={disallowPaths}
                aiPolicy={aiPolicy}
                siteUrl={settings.site_url || "https://imagiq.com"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB: Sitemap ─── */}
        <TabsContent value="sitemap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuracion del Sitemap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Generar sitemap automaticamente</p>
                  <p className="text-sm text-muted-foreground">Incluye productos, categorias y paginas activas</p>
                </div>
                <Switch
                  checked={sitemapEnabled}
                  onCheckedChange={v => updateField("sitemap_enabled", v ? "true" : "false")}
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <code className="text-sm flex-1">{settings.site_url || "https://imagiq.com"}/sitemap.xml</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(`${settings.site_url || "https://imagiq.com"}/sitemap.xml`)
                    toast.success("URL copiada")
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(`${settings.site_url || "https://imagiq.com"}/sitemap.xml`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>El sitemap se genera automaticamente e incluye:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Paginas estaticas (inicio, productos, ofertas, tiendas, soporte)</li>
                  <li>Paginas dinamicas del CMS (landing pages, documentos legales)</li>
                  <li>Categorias de productos</li>
                  <li>Paginas de ventas corporativas</li>
                </ul>
                <p className="mt-2">Las paginas privadas (carrito, checkout, perfil) se excluyen automaticamente.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB: Paginas ─── */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO por pagina</CardTitle>
              <CardDescription>Revisa y edita los metadatos de cada pagina de tu sitio</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-8 text-center">
                El editor de SEO por pagina estara disponible proximamente. Por ahora, los metadatos se configuran en la seccion General.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
