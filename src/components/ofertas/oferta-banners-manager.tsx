import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BannerMediaUpload } from "@/components/banners/forms/banner-media-upload"
import { ContentBlocksManager } from "@/components/banners/forms/content-boxes-manager"
import { ContentBlock } from "@/types/banner"

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

interface OfertaBannersManagerProps {
  banners: Array<{ 
    id: string
    data: BannerData
    files: BannerFiles
    contentBlocks: ContentBlock[]
  }>
  onBannersChange: (banners: Array<{ 
    id: string
    data: BannerData
    files: BannerFiles
    contentBlocks: ContentBlock[]
  }>) => void
  onActiveBannerChange: (bannerId: string) => void
  activeBannerId: string
}

export function OfertaBannersManager({
  banners,
  onBannersChange,
  onActiveBannerChange,
  activeBannerId,
}: OfertaBannersManagerProps) {
  const activeBanner = banners.find((b) => b.id === activeBannerId)

  const handleFieldChange = (field: string, value: string) => {
    const updated = banners.map((b) =>
      b.id === activeBannerId ? { ...b, data: { ...b.data, [field]: value } } : b
    )
    onBannersChange(updated)
  }

  const handleFileChange = (field: string, file: File | undefined) => {
    const updated = banners.map((b) =>
      b.id === activeBannerId ? { ...b, files: { ...b.files, [field]: file } } : b
    )
    onBannersChange(updated)
  }

  const handleContentBlocksChange = (blocks: ContentBlock[]) => {
    const updated = banners.map((b) =>
      b.id === activeBannerId ? { ...b, contentBlocks: blocks } : b
    )
    onBannersChange(updated)
  }

  const handleAddBlock = () => {
    if (!activeBanner) return
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      position_desktop: { x: 50, y: 50 },
      position_mobile: { x: 50, y: 50 },
      title: { text: "Título", fontSize: "3rem", fontWeight: "700", color: "#000000" },
    }
    handleContentBlocksChange([...activeBanner.contentBlocks, newBlock])
  }

  const handleRemoveBlock = (blockId: string) => {
    if (!activeBanner) return
    handleContentBlocksChange(activeBanner.contentBlocks.filter(b => b.id !== blockId))
  }

  const handleUpdateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    if (!activeBanner) return
    handleContentBlocksChange(
      activeBanner.contentBlocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
    )
  }

  const handleAddBanner = () => {
    const newId = `banner-${Date.now()}`
    const newBanner = {
      id: newId,
      data: {
        id: newId,
        name: `Banner ${banners.length + 1}`,
        placement: "ofertas-landing",
        link_url: "",
      },
      files: {},
      contentBlocks: [],
    }
    onBannersChange([...banners, newBanner])
    onActiveBannerChange(newId)
  }

  const handleDeleteBanner = (bannerId: string) => {
    const updated = banners.filter((b) => b.id !== bannerId)
    onBannersChange(updated)
    if (activeBannerId === bannerId && updated.length > 0) {
      onActiveBannerChange(updated[0].id)
    }
  }

  if (!activeBanner) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Gestiona los banners del carrusel ({banners.length} banner{banners.length > 1 ? "s" : ""})
        </p>
        <Button type="button" onClick={handleAddBanner} size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Banner
        </Button>
      </div>

      <Tabs value={activeBannerId} onValueChange={onActiveBannerChange} className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-2">
          {banners.map((banner, index) => (
            <div key={banner.id} className="flex items-center gap-2">
              <TabsTrigger value={banner.id}>
                Banner {index + 1}
              </TabsTrigger>
              {banners.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDeleteBanner(banner.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </TabsList>

        <TabsContent value={activeBannerId} className="space-y-6 mt-6">
          <div>
            <h4 className="font-medium mb-4">Información del Banner</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="banner-name">Nombre del Banner</Label>
                <Input
                  id="banner-name"
                  value={activeBanner.data.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder="Ej: Banner Principal"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Medios del Banner</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Dimensiones recomendadas: Desktop <strong>2520×620px</strong> | Mobile <strong>828×620px</strong>
            </p>
            <BannerMediaUpload
              files={activeBanner.files}
              existingUrls={{
                desktop_image_url: activeBanner.data.desktop_image_url,
                desktop_video_url: activeBanner.data.desktop_video_url,
                mobile_image_url: activeBanner.data.mobile_image_url,
                mobile_video_url: activeBanner.data.mobile_video_url,
              }}
              placement={activeBanner.data.placement}
              onFileChange={handleFileChange}
            />
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-4">Bloques de Contenido</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Crea bloques con título, subtítulo, descripción y botones personalizables con configuración independiente para desktop y mobile.
            </p>
            <ContentBlocksManager
              blocks={activeBanner.contentBlocks}
              onAddBlock={handleAddBlock}
              onRemoveBlock={handleRemoveBlock}
              onUpdateBlock={handleUpdateBlock}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
