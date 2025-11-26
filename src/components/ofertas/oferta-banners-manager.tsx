import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2 } from "lucide-react"
import { BannerFormFields } from "@/components/banners/forms/banner-form-fields"
import { BannerMediaUpload } from "@/components/banners/forms/banner-media-upload"
import { BannerTextStylesFields } from "@/components/banners/forms/banner-text-styles-fields"
import { BannerTextStyles } from "@/types/banner"

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

interface OfertaBannersManagerProps {
  banners: Array<{ id: string; data: BannerData; files: BannerFiles; textStyles: BannerTextStyles }>
  onBannersChange: (banners: Array<{ id: string; data: BannerData; files: BannerFiles; textStyles: BannerTextStyles }>) => void
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

  const handleTextStylesChange = (styles: BannerTextStyles) => {
    const updated = banners.map((b) =>
      b.id === activeBannerId ? { ...b, textStyles: styles } : b
    )
    onBannersChange(updated)
  }

  const handleAddBanner = () => {
    const newId = `banner-${Date.now()}`
    const newBanner = {
      id: newId,
      data: {
        id: newId,
        name: `Banner ${banners.length + 1}`,
        placement: "hero",
        link_url: "",
        title: "",
        description: "",
        cta: "",
        color_font: "#000000",
        coordinates: "",
        coordinates_mobile: "",
      },
      files: {},
      textStyles: {
        title: { fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: "700", lineHeight: "1.2" },
        description: { fontSize: "clamp(1rem, 2vw, 1.5rem)", fontWeight: "400", lineHeight: "1.5" },
        cta: { fontSize: "1rem", fontWeight: "600", padding: "0.75rem 1.5rem", borderWidth: "0px" },
      },
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
            <div key={banner.id} className="flex items-center gap-1">
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
            <BannerFormFields formData={activeBanner.data} onFieldChange={handleFieldChange} />
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-4">Medios del Banner</h4>
            <BannerMediaUpload
              files={activeBanner.files}
              placement={activeBanner.data.placement}
              onFileChange={handleFileChange}
            />
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-4">Estilos de Texto</h4>
            <BannerTextStylesFields
              textStyles={activeBanner.textStyles}
              onTextStylesChange={handleTextStylesChange}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
