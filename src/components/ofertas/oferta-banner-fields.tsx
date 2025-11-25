import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BannerFormFields } from "@/components/banners/forms/banner-form-fields"
import { BannerMediaUpload } from "@/components/banners/forms/banner-media-upload"
import { BannerTextStylesFields } from "@/components/banners/forms/banner-text-styles-fields"
import { BannerPreview } from "@/components/banners/preview/banner-preview"
import { BannerTextStyles, BannerPosition } from "@/types/banner"

interface OfertaBannerFieldsProps {
  formData: {
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
  files: {
    desktop_image?: File
    desktop_video?: File
    mobile_image?: File
    mobile_video?: File
  }
  existingUrls?: {
    desktop_image_url?: string
    desktop_video_url?: string
    mobile_image_url?: string
    mobile_video_url?: string
  }
  positionDesktop?: BannerPosition
  positionMobile?: BannerPosition
  textStyles?: BannerTextStyles
  onFieldChange: (field: string, value: string) => void
  onFileChange: (field: string, file: File | undefined) => void
  onPositionDesktopChange?: (position: BannerPosition) => void
  onPositionMobileChange?: (position: BannerPosition) => void
  onTextStylesChange?: (styles: BannerTextStyles) => void
}

export function OfertaBannerFields({
  formData,
  files,
  existingUrls,
  positionDesktop,
  positionMobile,
  textStyles,
  onFieldChange,
  onFileChange,
  onPositionDesktopChange,
  onPositionMobileChange,
  onTextStylesChange,
}: OfertaBannerFieldsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Banner</CardTitle>
          <CardDescription>
            Configura los textos y enlaces del banner de la oferta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BannerFormFields formData={formData} onFieldChange={onFieldChange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medios del Banner</CardTitle>
          <CardDescription>
            Sube las imágenes o videos para desktop y mobile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BannerMediaUpload
            files={files}
            existingUrls={existingUrls}
            placement={formData.placement}
            onFileChange={onFileChange}
          />
        </CardContent>
      </Card>

      {onTextStylesChange && (
        <Card>
          <CardHeader>
            <CardTitle>Estilos de Texto</CardTitle>
            <CardDescription>
              Personaliza el tamaño y peso de título, descripción y CTA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BannerTextStylesFields
              textStyles={textStyles}
              onTextStylesChange={onTextStylesChange}
            />
          </CardContent>
        </Card>
      )}

      {onPositionDesktopChange && onPositionMobileChange && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa del Banner</CardTitle>
            <CardDescription>
              Arrastra los textos para posicionarlos en el banner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BannerPreview
              desktop_image={files.desktop_image || existingUrls?.desktop_image_url}
              desktop_video={files.desktop_video || existingUrls?.desktop_video_url}
              mobile_image={files.mobile_image || existingUrls?.mobile_image_url}
              mobile_video={files.mobile_video || existingUrls?.mobile_video_url}
              title={formData.title}
              description={formData.description}
              cta={formData.cta}
              color_font={formData.color_font}
              link_url={formData.link_url}
              placement={formData.placement}
              position_desktop={positionDesktop}
              position_mobile={positionMobile}
              onPositionDesktopChange={onPositionDesktopChange}
              onPositionMobileChange={onPositionMobileChange}
              text_styles={textStyles}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
