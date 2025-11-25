import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BannerPreview } from "@/components/banners/preview/banner-preview"
import { Eye } from "lucide-react"
import type { BannerItem } from "@/hooks/use-oferta-form"
import type { BannerPosition } from "@/types/banner"

interface OfertaBannerPreviewCardProps {
  activeBanner: BannerItem
  onPositionDesktopChange: (position: BannerPosition) => void
  onPositionMobileChange: (position: BannerPosition) => void
}

export function OfertaBannerPreviewCard({
  activeBanner,
  onPositionDesktopChange,
  onPositionMobileChange,
}: OfertaBannerPreviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Vista Previa
        </CardTitle>
        <CardDescription>
          Arrastra los textos para posicionarlos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BannerPreview
          desktop_image={activeBanner.files.desktop_image}
          desktop_video={activeBanner.files.desktop_video}
          mobile_image={activeBanner.files.mobile_image}
          mobile_video={activeBanner.files.mobile_video}
          title={activeBanner.data.title}
          description={activeBanner.data.description}
          cta={activeBanner.data.cta}
          color_font={activeBanner.data.color_font}
          link_url={activeBanner.data.link_url}
          placement={activeBanner.data.placement}
          position_desktop={activeBanner.positionDesktop}
          position_mobile={activeBanner.positionMobile}
          onPositionDesktopChange={onPositionDesktopChange}
          onPositionMobileChange={onPositionMobileChange}
          text_styles={activeBanner.textStyles}
        />
      </CardContent>
    </Card>
  )
}
