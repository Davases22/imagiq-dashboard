import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BannerPreview } from "@/components/banners/preview/banner-preview"
import { Eye } from "lucide-react"
import type { BannerItem } from "@/hooks/use-oferta-form"
import type { BannerPosition } from "@/types/banner"

interface OfertaBannerPreviewCardProps {
  activeBanner: BannerItem
  onPositionDesktopChange: (position: BannerPosition) => void
  onPositionMobileChange: (position: BannerPosition) => void
  onBlockPositionChange?: (blockId: string, device: 'desktop' | 'mobile', position: { x: number; y: number }) => void
}

export function OfertaBannerPreviewCard({
  activeBanner,
  onPositionDesktopChange,
  onPositionMobileChange,
  onBlockPositionChange,
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
          desktop_image={activeBanner.files.desktop_image || activeBanner.data.desktop_image_url}
          desktop_video={activeBanner.files.desktop_video || activeBanner.data.desktop_video_url}
          mobile_image={activeBanner.files.mobile_image || activeBanner.data.mobile_image_url}
          mobile_video={activeBanner.files.mobile_video || activeBanner.data.mobile_video_url}
          link_url={activeBanner.data.link_url}
          placement={activeBanner.data.placement}
          content_blocks={activeBanner.contentBlocks}
          isLandingPage={true}
          onBlockPositionChange={onBlockPositionChange}
        />
      </CardContent>
    </Card>
  )
}
