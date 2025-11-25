"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, RotateCcw } from "lucide-react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DraggableBannerOverlay } from "./draggable-banner-overlay";
import { BannerContentOverlay } from "./banner-content-overlay";
import type { BannerPosition } from "@/types/banner";
import { gridToPercentage, getDefaultPosition } from "../utils/position-utils";

interface BannerPreviewProps {
  desktop_image?: File | string;
  desktop_video?: File | string;
  mobile_image?: File | string;
  mobile_video?: File | string;
  title?: string;
  description?: string;
  cta?: string;
  color_font?: string;
  link_url?: string;
  placement?: string;
  position_desktop?: BannerPosition;
  position_mobile?: BannerPosition;
  onPositionDesktopChange?: (position: BannerPosition) => void;
  onPositionMobileChange?: (position: BannerPosition) => void;
  coordinates?: string;
  coordinatesMobile?: string;
  onCoordinatesChange?: (coordinates: string) => void;
  onCoordinatesMobileChange?: (coordinates: string) => void;
  text_styles?: import('@/types/banner').BannerTextStyles;
}

interface BannerContentProps {
  image?: File | string;
  video?: File | string;
  title?: string;
  description?: string;
  cta?: string;
  colorFont: string;
  linkUrl?: string;
  position?: BannerPosition;
  device: "desktop" | "mobile";
  placement?: string;
  onPositionChange?: (position: BannerPosition) => void;
  textStyles?: import('@/types/banner').BannerTextStyles;
}

type DeviceType = "desktop" | "mobile";

function getMediaUrl(media: File | string | undefined): string | undefined {
  if (!media) return undefined;
  if (typeof media === "string") return media;
  return URL.createObjectURL(media);
}

const getStyles = (placement: string | undefined, device: DeviceType) => {
  const isFlexible = placement === "category-top" || placement === "product-detail" || placement?.startsWith("banner-");

  if (isFlexible) {
    return {
      aspectRatio: "",
      maxWidth: "max-w-md", // ~448px para banners de categoría (verticales)
      mediaClass: "w-full h-auto pointer-events-none",
      minHeight: "min-h-[150px]",
    };
  }

  const isDesktop = device === "desktop";

  // Ofertas banners - aspect ratio personalizado para ofertas
  if (placement?.startsWith("ofertas-")) {
    return {
      aspectRatio: isDesktop ? "aspect-[1261/560]" : "aspect-[414/621]",
      maxWidth: isDesktop ? "max-w-2xl" : "max-w-sm",
      mediaClass: "absolute inset-0 w-full h-full object-cover pointer-events-none",
      minHeight: "",
    };
  }

  // Hero banner - más grande
  if (placement === "hero") {
    return {
      aspectRatio: isDesktop ? "aspect-[16/9]" : "aspect-[9/16]",
      maxWidth: isDesktop ? "max-w-2xl" : "max-w-sm", // ~672px desktop
      mediaClass: "absolute inset-0 w-full h-full object-cover pointer-events-none",
      minHeight: "",
    };
  }

  // Home banners - tamaño intermedio
  if (placement?.startsWith("home-")) {
    return {
      aspectRatio: isDesktop ? "aspect-[16/9]" : "aspect-[9/16]",
      maxWidth: isDesktop ? "max-w-xl" : "max-w-sm", // ~576px desktop
      mediaClass: "absolute inset-0 w-full h-full object-cover pointer-events-none",
      minHeight: "",
    };
  }

  // Otros banners (por defecto)
  return {
    aspectRatio: isDesktop ? "aspect-[16/9]" : "aspect-[9/16]",
    maxWidth: isDesktop ? "max-w-2xl" : "max-w-sm",
    mediaClass: "absolute inset-0 w-full h-full object-cover pointer-events-none",
    minHeight: "",
  };
};

const isSingleView = (placement?: string) =>
  placement === "product-detail" || placement === "category-top" || Boolean(placement?.startsWith("banner-"));

// Componente especial para navbar mobile (tira de notificación)
function NavbarMobileBanner({ title, description, cta, linkUrl }: { title?: string; description?: string; cta?: string; linkUrl?: string }) {
  if (!title && !description && !cta) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-lg border-2 border-dashed bg-muted p-4">
        <p className="text-muted-foreground text-sm text-center">
          Agrega título, descripción o CTA para ver el preview
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-black text-white px-6 py-3 rounded-lg shadow-lg">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {title && (
            <p className="font-bold text-base">{title}</p>
          )}
          {description && (
            <p className="text-sm opacity-90">{description}</p>
          )}
          {cta && (
            <button className="mt-1 bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">
              {cta}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BannerContent({ image, video, title, description, cta, colorFont, linkUrl, device, placement, position, onPositionChange, textStyles }: Readonly<BannerContentProps>) {
  const [showContent, setShowContent] = useState(!video);
  const [imageUrl, setImageUrl] = useState<string>();
  const [videoUrl, setVideoUrl] = useState<string>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    if (!containerRef.current || !onPositionChange) return;
    const rect = containerRef.current.getBoundingClientRect();
    const current = position || getDefaultPosition();
    const newPosition: BannerPosition = {
      x: Math.max(0, Math.min(100, current.x + (event.delta.x / rect.width) * 100)),
      y: Math.max(0, Math.min(100, current.y + (event.delta.y / rect.height) * 100)),
      imageWidth: imageRef.current?.naturalWidth,
      imageHeight: imageRef.current?.naturalHeight,
    };
    onPositionChange(newPosition);
  };

  useEffect(() => {
    const url = getMediaUrl(image);
    setImageUrl(url);
    if (url && image instanceof File) return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    const url = getMediaUrl(video);
    setVideoUrl(url);
    if (url) {
      setShowContent(false);
      if (video instanceof File) return () => URL.revokeObjectURL(url);
    }
  }, [video]);

  const { aspectRatio, maxWidth, mediaClass, minHeight } = getStyles(placement, device);

  if (!image && !video) {
    return (
      <div className={`relative ${aspectRatio} ${maxWidth} w-full rounded-lg border-2 border-dashed bg-muted flex items-center justify-center ${minHeight}`}>
        <div className="text-center p-4">
          <p className="text-muted-foreground text-sm">Preview {device === "desktop" ? "Desktop" : "Mobile"}</p>
          <p className="text-muted-foreground text-xs mt-1">Sube una imagen o video</p>
        </div>
      </div>
    );
  }

  const currentPos = position || getDefaultPosition();
  const hasContent = Boolean(title || description || cta || linkUrl);
  const Overlay = onPositionChange ? DraggableBannerOverlay : BannerContentOverlay;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div ref={containerRef} className={`relative ${aspectRatio} ${maxWidth} w-full rounded-lg overflow-hidden bg-black`}>
        {video && videoUrl && !showContent && (
          <video ref={videoRef} src={videoUrl} className={mediaClass} autoPlay muted playsInline onEnded={() => setShowContent(true)} />
        )}
        {(showContent || !video) && imageUrl && (
          <>
            <img ref={imageRef} src={imageUrl} alt="Banner preview" className={mediaClass} />
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-9 grid-rows-9">
                {Array.from({ length: 81 }, (_, i) => <div key={`g-${Math.floor(i/9)}-${i%9}`} className="border border-dashed border-white/10" />)}
              </div>
            </div>
            {hasContent && <Overlay id={`overlay-${device}`} title={title} description={description} cta={cta} colorFont={colorFont} linkUrl={linkUrl} position={currentPos} device={device} textStyles={textStyles} placement={placement} />}
          </>
        )}
        <div className="absolute top-4 left-4 pointer-events-none">
          <Badge variant="secondary" className="gap-1">
            {device === "desktop" ? <Monitor className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
            {device === "desktop" ? "Desktop" : "Mobile"}
          </Badge>
        </div>
        {video && !showContent && (
          <div className="absolute top-4 right-4 pointer-events-none">
            <Badge variant="destructive">Video reproduciendo</Badge>
          </div>
        )}
      </div>
    </DndContext>
  );
}

export function BannerPreview(props: Readonly<BannerPreviewProps>) {
  const { desktop_image, desktop_video, mobile_image, mobile_video, title, description, cta, color_font = "#FFFFFF", link_url, placement,
    position_desktop, position_mobile, onPositionDesktopChange, onPositionMobileChange, coordinates, coordinatesMobile, text_styles } = props;

  const [viewMode, setViewMode] = useState<DeviceType>("desktop");
  const [reloadKey, setReloadKey] = useState(0);

  // Preview especial para navbar mobile
  if (placement === "notification") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline">Banner Navbar Mobile</Badge>
          <Button variant="outline" size="sm" onClick={() => setReloadKey(p => p + 1)} title="Recargar preview">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <NavbarMobileBanner 
          title={title} 
          description={description} 
          cta={cta} 
          linkUrl={link_url} 
        />
      </div>
    );
  }

  const getPos = (mode: DeviceType) => {
    const pos = mode === "desktop"
      ? (position_desktop || gridToPercentage(coordinates))
      : (position_mobile || gridToPercentage(coordinatesMobile));
    return pos || getDefaultPosition();
  };

  const getHandler = (mode: DeviceType) => mode === "desktop" ? onPositionDesktopChange : onPositionMobileChange;

  const renderContent = (mode: DeviceType, key: string) => {
    const pos = getPos(mode);
    const handler = getHandler(mode);
    const isFlexible = placement === "category-top" || placement === "product-detail" || placement?.startsWith("banner-");
    
    return (
      <div className={`flex justify-center ${isFlexible ? 'max-w-md mx-auto' : ''}`}>
        <BannerContent
          key={key}
          image={mode === "desktop" ? desktop_image : mobile_image}
          video={mode === "desktop" ? desktop_video : mobile_video}
          title={title}
          description={description}
          cta={cta}
          colorFont={color_font}
          linkUrl={link_url}
          position={pos}
          onPositionChange={handler}
          device={mode}
          placement={placement}
          textStyles={text_styles}
        />
      </div>
    );
  };

  if (isSingleView(placement)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline">Vista General</Badge>
          <Button variant="outline" size="sm" onClick={() => setReloadKey(p => p + 1)} title="Recargar preview">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        {renderContent("desktop", `g-${reloadKey}`)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg flex-1">
          {(["desktop", "mobile"] as const).map((mode) => (
            <Button key={mode} variant={viewMode === mode ? "default" : "ghost"} size="sm" onClick={() => setViewMode(mode)} className="flex-1">
              {mode === "desktop" ? <Monitor className="h-4 w-4 mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
              {mode === "desktop" ? "Desktop" : "Mobile"}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setReloadKey(p => p + 1)} title="Recargar preview">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      {viewMode === "desktop" ? renderContent("desktop", `d-${reloadKey}`) : renderContent("mobile", `m-${reloadKey}`)}
    </div>
  );
}
