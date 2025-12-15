"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, RotateCcw } from "lucide-react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DraggableBannerOverlay } from "./draggable-banner-overlay";
import { BannerContentOverlay } from "./banner-content-overlay";
import type { BannerPosition, ContentBlock } from "@/types/banner";
import { gridToPercentage, getDefaultPosition } from "../utils/position-utils";

interface BannerPreviewProps {
  bannerId?: string;
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
  isLandingPage?: boolean; // Para usar dimensiones específicas de landing pages
  position_desktop?: BannerPosition;
  position_mobile?: BannerPosition;
  onPositionDesktopChange?: (position: BannerPosition) => void;
  onPositionMobileChange?: (position: BannerPosition) => void;
  coordinates?: string;
  coordinatesMobile?: string;
  onCoordinatesChange?: (coordinates: string) => void;
  onCoordinatesMobileChange?: (coordinates: string) => void;
  text_styles?: import('@/types/banner').BannerTextStyles;
  content_blocks?: ContentBlock[];
  onBlockPositionChange?: (blockId: string, device: 'desktop' | 'mobile', position: { x: number; y: number }) => void;
}

interface BannerContentProps {
  bannerId?: string;
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
  isLandingPage?: boolean;
  onPositionChange?: (position: BannerPosition) => void;
  textStyles?: import('@/types/banner').BannerTextStyles;
  contentBlocks?: ContentBlock[];
  onBlockPositionChange?: (blockId: string, device: 'desktop' | 'mobile', position: { x: number; y: number }) => void;
}

type DeviceType = "desktop" | "mobile";

function getMediaUrl(media: File | string | undefined): string | undefined {
  if (!media) return undefined;
  if (typeof media === "string") return media;
  return URL.createObjectURL(media);
}

const getStyles = (placement: string | undefined, device: DeviceType, isLandingPage?: boolean) => {
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

  // Landing Pages banners - aspect ratio específico panorámico
  // Desktop: 2520x620 → simplificado a 126:31
  // Mobile: 828x620 → simplificado a 207:155
  if (isLandingPage) {
    return {
      aspectRatio: isDesktop ? "aspect-[126/31]" : "aspect-[207/155]",
      maxWidth: isDesktop ? "max-w-full" : "max-w-sm",
      mediaClass: "absolute inset-0 w-full h-full object-cover pointer-events-none",
      minHeight: "",
    };
  }

  // Ofertas banners - aspect ratio personalizado para ofertas
  // Actualizado para coincidir con frontend y getRealBannerWidth: 1210x310
  if (placement?.startsWith("ofertas-")) {
    return {
      aspectRatio: isDesktop ? "aspect-[1210/310]" : "aspect-[414/310]",
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

// Helper para escalar tamaños en el preview (40% del tamaño original)
const scaleFontSize = (size: string): string => {
  const regex = /([\d.]+)(rem|px|em)/;
  const match = regex.exec(size);
  if (match) {
    const value = Number.parseFloat(match[1]) * 0.4;
    return `${value}${match[2]}`;
  }
  return size;
};

const scalePadding = (padding: string): string => {
  return padding.replaceAll(/([\d.]+)(px|rem|em)/g, (_match, num, unit) => {
    const value = Number.parseFloat(num) * 0.4;
    return `${value}${unit}`;
  });
};

// Componente para renderizar bloques de contenido con drag & drop
function ContentBlockOverlay({ 
  block, 
  device, 
  onPositionChange,
  onDragStart 
}: { 
  block: ContentBlock; 
  device: DeviceType;
  onPositionChange?: (blockId: string, position: { x: number; y: number }) => void;
  onDragStart?: (blockId: string, e: React.MouseEvent, element: HTMLDivElement) => void;
}) {
  const isMobile = device === "mobile";
  const position = isMobile ? block.position_mobile : block.position_desktop;
  
  // Container configs con fallback a desktop si no hay mobile config
  const textAlign = (isMobile && block.textAlign_mobile) ? block.textAlign_mobile : (block.textAlign || 'left');
  const gap = (isMobile && block.gap_mobile) ? block.gap_mobile : (block.gap || '12px');
  
  const blockRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onPositionChange || !onDragStart || !blockRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    onDragStart(block.id, e, blockRef.current);
  };

  // Ajustar transform basado en textAlign para landing pages
  let transformX = '-50%'; // Por defecto: centrado
  if (textAlign === 'left') {
    transformX = '0%'; // Izquierda: el punto está en el borde izquierdo
  } else if (textAlign === 'right') {
    transformX = '-100%'; // Derecha: el punto está en el borde derecho
  }

  return (
    <div
      ref={blockRef}
      className="absolute group"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(${transformX}, -50%)`,
        cursor: onPositionChange ? 'move' : 'default',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Visualización del contenedor (borde punteado) */}
      <div className="absolute inset-0 border-2 border-dashed border-blue-400 dark:border-blue-500 opacity-0 group-hover:opacity-50 rounded-md pointer-events-none transition-opacity" />
      {/* Indicador de drag cuando hay onPositionChange */}
      {onPositionChange && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md shadow-sm whitespace-nowrap">
            Arrastra para mover
          </div>
        </div>
      )}
      
      <div
        className="flex flex-col pointer-events-auto"
        style={{
          gap,
        }}
      >
        {/* Título */}
        {block.title && (() => {
          const titleConfig = isMobile && block.title_mobile 
            ? { ...block.title, ...block.title_mobile }
            : block.title;
          
          return (
            <h2
              style={{
                fontSize: scaleFontSize(titleConfig.fontSize || '2rem'),
                fontWeight: titleConfig.fontWeight || '700',
                color: titleConfig.color || '#ffffff',
                lineHeight: titleConfig.lineHeight || '1.2',
                textTransform: titleConfig.textTransform || 'none',
                letterSpacing: titleConfig.letterSpacing || 'normal',
                textShadow: titleConfig.textShadow || '2px 2px 4px rgba(0,0,0,0.5)',
                margin: 0,
                whiteSpace: 'pre-line',
                textAlign,
              }}
            >
              {block.title.text}
            </h2>
          );
        })()}

        {/* Subtítulo */}
        {block.subtitle && (() => {
          const subtitleConfig = isMobile && block.subtitle_mobile 
            ? { ...block.subtitle, ...block.subtitle_mobile }
            : block.subtitle;
          
          return (
            <h3
              style={{
                fontSize: scaleFontSize(subtitleConfig.fontSize || '1.5rem'),
                fontWeight: subtitleConfig.fontWeight || '600',
                color: subtitleConfig.color || '#ffffff',
                lineHeight: subtitleConfig.lineHeight || '1.3',
                textTransform: subtitleConfig.textTransform || 'none',
                margin: 0,
                whiteSpace: 'pre-line',
                textAlign,
              }}
            >
              {block.subtitle.text}
            </h3>
          );
        })()}

        {/* Descripción */}
        {block.description && (() => {
          const descriptionConfig = isMobile && block.description_mobile 
            ? { ...block.description, ...block.description_mobile }
            : block.description;
          
          return (
            <p
              style={{
                fontSize: scaleFontSize(descriptionConfig.fontSize || '1rem'),
                fontWeight: descriptionConfig.fontWeight || '400',
                color: descriptionConfig.color || '#ffffff',
                lineHeight: descriptionConfig.lineHeight || '1.5',
                margin: 0,
                whiteSpace: 'pre-line',
                textAlign,
              }}
            >
              {block.description.text}
            </p>
          );
        })()}

        {/* CTA */}
        {block.cta && (() => {
          const ctaConfig = isMobile && block.cta_mobile 
            ? { ...block.cta, ...block.cta_mobile }
            : block.cta;
          
          return (
            <div style={{ textAlign }}>
              <a
                href={block.cta.link_url || '#'}
                className="inline-block"
                style={{
                  fontSize: scaleFontSize(ctaConfig.fontSize || '1rem'),
                  fontWeight: ctaConfig.fontWeight || '600',
                  backgroundColor: ctaConfig.backgroundColor || '#ffffff',
                  color: ctaConfig.color || '#000000',
                  padding: scalePadding(ctaConfig.padding || '12px 24px'),
                  borderRadius: ctaConfig.borderRadius || '8px',
                  border: ctaConfig.border || 'none',
                  textDecoration: 'none',
                  textAlign: 'center',
                  whiteSpace: 'pre-line',
                }}
              >
                {block.cta.text}
              </a>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

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

function BannerContent({ bannerId, image, video, title, description, cta, colorFont, linkUrl, device, placement, isLandingPage, position, onPositionChange, textStyles, contentBlocks, onBlockPositionChange }: Readonly<BannerContentProps>) {
  const [showContent, setShowContent] = useState(!video);
  const [imageUrl, setImageUrl] = useState<string>();
  const [videoUrl, setVideoUrl] = useState<string>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  /**
   * Obtiene el tamaño real del banner (no el del preview) según el placement
   * Necesario para convertir correctamente píxeles de drag a porcentajes
   */
  const getRealBannerSize = (placement?: string): { width: number; height: number } => {
    // Banners de ofertas (landing pages): 1210x310
    if (placement?.startsWith("ofertas-")) {
      return { width: 1210, height: 310 };
    }
    // Hero banners: 1920x1080
    if (placement === "hero") {
      return { width: 1920, height: 1080 };
    }
    // Banners de categoría: 318x318
    if (placement === "category-top" || placement?.startsWith("banner-")) {
      return { width: 318, height: 318 };
    }
    // Banners Home: 1440x810
    if (placement?.startsWith("home-")) {
      return { width: 1440, height: 810 };
    }
    // Por defecto: 1440x810
    return { width: 1440, height: 810 };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!containerRef.current || !onPositionChange) return;
    const rect = containerRef.current.getBoundingClientRect();
    const current = position || getDefaultPosition();

    // Obtener el tamaño REAL del banner (no del preview) para calcular porcentajes correctos
    const realSize = getRealBannerSize(placement);

    // Calcular el factor de escala: cuánto más pequeño es el preview vs el banner real
    const scaleX = rect.width / realSize.width;
    const scaleY = rect.height / realSize.height;

    // Convertir el delta en píxeles del preview a porcentaje del banner real
    // delta.x es en píxeles del preview, así que lo escalamos al tamaño real primero
    const newPosition: BannerPosition = {
      x: Math.max(0, Math.min(100, current.x + (event.delta.x / scaleX / realSize.width) * 100)),
      y: Math.max(0, Math.min(100, current.y + (event.delta.y / scaleY / realSize.height) * 100)),
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

  // Handlers para mouse drag de bloques
  useEffect(() => {
    if (!isDragging || !draggedBlockId || !onBlockPositionChange || !containerRef.current || !dragOffset) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !dragOffset) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      // Calcular posición considerando el offset inicial del mouse
      const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
      
      // Sin límites estrictos - permite posicionar libremente
      // El navegador se encargará de renderizar correctamente
      // Pasar el device para actualizar solo la posición del dispositivo activo
      onBlockPositionChange(draggedBlockId, device, {
        x,
        y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedBlockId(null);
      setDragOffset(null);
    };

    // Eventos en document para que funcione incluso si el mouse sale del contenedor
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);

    // Prevenir selección de texto durante el drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, draggedBlockId, onBlockPositionChange, dragOffset]);

  const { aspectRatio, maxWidth, mediaClass, minHeight } = getStyles(placement, device, isLandingPage);

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
  // Solo mostrar overlay legacy si NO hay content_blocks
  const hasLegacyContent = Boolean(title || description || cta || linkUrl) && !contentBlocks?.length;
  const Overlay = onPositionChange ? DraggableBannerOverlay : BannerContentOverlay;
  const overlayId = `overlay-${bannerId || 'default'}-${device}`;

  const handleBlockDragStart = (blockId: string, e: React.MouseEvent, element: HTMLDivElement) => {
    if (!containerRef.current) return;
    
    const elementRect = element.getBoundingClientRect();
    
    // Calcular el offset del mouse respecto al centro del elemento
    const offsetX = e.clientX - (elementRect.left + elementRect.width / 2);
    const offsetY = e.clientY - (elementRect.top + elementRect.height / 2);
    
    setDragOffset({ x: offsetX, y: offsetY });
    setDraggedBlockId(blockId);
    setIsDragging(true);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div 
        ref={containerRef} 
        className={`relative ${aspectRatio} ${maxWidth} w-full rounded-lg overflow-hidden bg-black`}
      >
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
            {hasLegacyContent && <Overlay id={overlayId} title={title} description={description} cta={cta} colorFont={colorFont} linkUrl={linkUrl} position={currentPos} device={device} textStyles={textStyles} placement={placement} />}
            {/* Renderizar bloques de contenido */}
            {contentBlocks && contentBlocks.length > 0 && (
              <div className="absolute inset-0">
                {contentBlocks.map((block) => (
                  <ContentBlockOverlay 
                    key={block.id} 
                    block={block} 
                    device={device}
                    onPositionChange={onBlockPositionChange ? (blockId, pos) => {
                      // Pasar el device para actualizar solo la posición del dispositivo activo
                      onBlockPositionChange(blockId, device, pos);
                    } : undefined}
                    onDragStart={handleBlockDragStart}
                  />
                ))}
              </div>
            )}
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
  const { bannerId, desktop_image, desktop_video, mobile_image, mobile_video, title, description, cta, color_font = "#FFFFFF", link_url, placement, isLandingPage,
    position_desktop, position_mobile, onPositionDesktopChange, onPositionMobileChange, coordinates, coordinatesMobile, text_styles, content_blocks, onBlockPositionChange } = props;

  const [viewMode, setViewMode] = useState<DeviceType>("desktop");
  const [reloadKey, setReloadKey] = useState(0);

  // Preview especial para navbar mobile
  if (placement === "notification") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline">Banner Navbar Mobile</Badge>
          <Button type="button" variant="outline" size="sm" onClick={() => setReloadKey(p => p + 1)} title="Recargar preview">
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
          bannerId={bannerId}
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
          isLandingPage={isLandingPage}
          textStyles={text_styles}
          contentBlocks={content_blocks}
          onBlockPositionChange={onBlockPositionChange ? (blockId, device, pos) => {
            onBlockPositionChange(blockId, device, pos);
          } : undefined}
        />
      </div>
    );
  };

  if (isSingleView(placement)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline">Vista General</Badge>
          <Button type="button" variant="outline" size="sm" onClick={() => setReloadKey(p => p + 1)} title="Recargar preview">
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
            <Button type="button" key={mode} variant={viewMode === mode ? "default" : "ghost"} size="sm" onClick={() => setViewMode(mode)} className="flex-1">
              {mode === "desktop" ? <Monitor className="h-4 w-4 mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
              {mode === "desktop" ? "Desktop" : "Mobile"}
            </Button>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setReloadKey(p => p + 1)} title="Recargar preview">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      {viewMode === "desktop" ? renderContent("desktop", `d-${reloadKey}`) : renderContent("mobile", `m-${reloadKey}`)}
    </div>
  );
}
