"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ProductCardProps, ProductColor } from "@/features/products/useProducts"
import { EditImagesModal } from "./EditImagesModal"
import { EditPremiumModal } from "./EditPremiumModal"
import { productEndpoints } from "@/lib/api"
import { toast } from "sonner"
import emptyImg from "@/img/empty.jpeg"

interface ProductMultimediaProps {
  product: ProductCardProps
  selectedColor: ProductColor | null
  currentImage: string | any
  currentDiscount: string | undefined
  currentStock: number
}

export function ProductMultimedia({
  product,
  selectedColor,
  currentImage,
  currentDiscount,
  currentStock,
}: ProductMultimediaProps) {
  // Detectar si es un bundle: SKU o ID empieza con "F" (importante)
  const isBundle = product.sku?.startsWith('F') || product.id?.startsWith('F') || product.isBundle === true
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const [isPremiumMode, setIsPremiumMode] = useState(() => {
    // Cargar el estado desde localStorage al inicializar
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isPremiumMode')
      return saved === 'true'
    }
    return false
  })
  const [premiumVideos, setPremiumVideos] = useState<string[]>([])
  const [premiumImages, setPremiumImages] = useState<string[]>([])
  const [devicePremiumImage, setDevicePremiumImage] = useState<string | null>(null)
  const [isLoadingPremium, setIsLoadingPremium] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [currentPremiumImageIndex, setCurrentPremiumImageIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)

  // Función helper para verificar si el producto es premium (insensible a mayúsculas)
  const isPremiumProduct = (() => {
    if (!product.segmento || !Array.isArray(product.segmento)) return false
    return product.segmento.some(seg => 
      typeof seg === 'string' && seg.toLowerCase() === 'premium'
    )
  })()

  // Guardar el estado de isPremiumMode en localStorage (solo para productos premium)
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Evitar que el modo premium "se pegue" a productos no premium
    if (!isPremiumProduct) {
      localStorage.setItem('isPremiumMode', 'false')
      return
    }
    localStorage.setItem('isPremiumMode', String(isPremiumMode))
  }, [isPremiumMode, isPremiumProduct])

  // Crear array de items del carrusel (videos + TODAS las imágenes del carrusel)
  const carouselItems = (() => {
    const items: Array<{ type: 'video' | 'image', url: string }> = [];
    // Agregar todos los videos primero
    premiumVideos.forEach(url => {
      items.push({ type: 'video', url });
    });
    // ✅ Agregar TODAS las imágenes del carrusel (imagen_premium completo)
    premiumImages.forEach(url => {
      items.push({ type: 'image', url });
    });
    return items;
  })()

  // Reiniciar el índice de imagen cuando cambie el color o el tipo de producto
  useEffect(() => {
    setCurrentImageIndex(0)
    setCurrentVideoIndex(0)
  }, [selectedColor, isBundle])

  // Manejar carga y errores del video cuando cambia la URL
  useEffect(() => {
    const video = videoRef.current
    if (!video || carouselItems[currentVideoIndex]?.type !== 'video') {
      setVideoLoading(false)
      setVideoError(null)
      return
    }

    setVideoError(null)
    setVideoLoading(true)

    const handleCanPlay = () => {
      setVideoLoading(false)
      setVideoError(null)
    }
    
    const handleError = () => {
      setVideoLoading(false)
      const error = video.error
      if (error) {
        let errorMessage = 'Error al cargar el video'
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = 'La reproducción del video fue cancelada'
            break
          case error.MEDIA_ERR_NETWORK:
            errorMessage = 'Error de red al cargar el video. Verifica tu conexión.'
            break
          case error.MEDIA_ERR_DECODE:
            errorMessage = 'Error al decodificar el video'
            break
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'El formato del video no es compatible'
            break
        }
        setVideoError(errorMessage)
        console.error('Error de video:', {
          message: errorMessage,
          code: error.code,
          src: video.src,
          networkState: video.networkState,
          readyState: video.readyState
        })
      }
    }
    
    const handleLoadStart = () => {
      setVideoLoading(true)
      setVideoError(null)
    }
    
    const handleLoadedData = () => {
      setVideoLoading(false)
    }

    const handleLoadedMetadata = () => {
      setVideoLoading(false)
    }

    // Agregar event listeners
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    // Si el video ya tiene metadata cargada, no mostrar loading
    if (video.readyState >= 2) {
      setVideoLoading(false)
    }
    
    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [currentVideoIndex, carouselItems])

  // Cargar contenido premium cuando se activa el switch (solo si el producto es premium)
  useEffect(() => {
    if (!isPremiumMode || !selectedColor || !isPremiumProduct) return

    setIsLoadingPremium(true)
    console.log("Selected Color Premium Data:", {
      premiumVideos: selectedColor.premiumVideos,
      premiumImages: selectedColor.premiumImages,
      devicePremiumImage: selectedColor.devicePremiumImage
    })

    // Los datos premium ya vienen en selectedColor desde el mapper
    setPremiumVideos(selectedColor.premiumVideos || [])
    setPremiumImages(selectedColor.premiumImages || []) // TODAS las imágenes del CARRUSEL
    setDevicePremiumImage(selectedColor.devicePremiumImage || null) // Imagen del DISPOSITIVO

    setIsLoadingPremium(false)
  }, [isPremiumMode, selectedColor, isPremiumProduct])

  // Si no es premium, forzamos el modo premium a apagado para evitar render incorrecto
  useEffect(() => {
    if (!isPremiumProduct && isPremiumMode) {
      setIsPremiumMode(false)
    }
  }, [isPremiumProduct, isPremiumMode])

  return (
    <Card className="h-fit">
      <CardContent className="p-6">
        {/* Botón de editar y switch premium */}
        <div className="flex justify-between items-center mb-4">
          {isPremiumProduct ? (
            <>
              <div className="flex items-center gap-3">
                <Switch
                  id="premium-mode"
                  checked={isPremiumMode}
                  onCheckedChange={setIsPremiumMode}
                />
                <Label htmlFor="premium-mode" className="text-sm font-medium cursor-pointer">
                  Contenido Premium
                </Label>
              </div>
              <div className="flex gap-2">
                {isPremiumMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPremiumModalOpen(true)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar Premium
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar imágenes
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Editar imágenes
              </Button>
            </div>
          )}
        </div>
        {isLoadingPremium ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Cargando contenido premium...</p>
            </div>
          </div>
        ) : (isPremiumMode && isPremiumProduct) ? (
          /* Contenido Premium */
          <>
            {/* Carrusel Premium (Videos + Imágenes excepto la última) */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Carrusel Premium</h3>
              {carouselItems.length > 0 ? (
                  <>
                    <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-black group">
                      {carouselItems[currentVideoIndex]?.type === 'video' ? (
                        <>
                          {videoLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                <p className="text-sm text-white">Cargando video...</p>
                              </div>
                            </div>
                          )}
                          {videoError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                              <div className="text-center p-4">
                                <p className="text-sm text-red-400 mb-2">{videoError}</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (videoRef.current) {
                                      videoRef.current.load()
                                    }
                                  }}
                                >
                                  Reintentar
                                </Button>
                              </div>
                            </div>
                          )}
                          <video
                            ref={videoRef}
                            src={carouselItems[currentVideoIndex].url}
                            className="w-full h-full object-contain"
                            controls
                            preload="auto"
                            playsInline
                            key={`${carouselItems[currentVideoIndex].url}-${currentVideoIndex}`}
                            style={{ maxHeight: '100%' }}
                          >
                            Tu navegador no soporta la reproducción de video.
                          </video>
                        </>
                      ) : (
                        <div className="relative w-full h-full">
                          <Image
                            src={carouselItems[currentVideoIndex]?.url || ''}
                            alt={`Carrusel ${currentVideoIndex + 1}`}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>
                      )}

                      {/* Botones de navegación - Solo mostrar cuando no es video o cuando no se está hover sobre controles */}
                      {carouselItems.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setCurrentVideoIndex((prev) =>
                                prev === 0 ? carouselItems.length - 1 : prev - 1
                              )
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            aria-label="Anterior"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setCurrentVideoIndex((prev) =>
                                prev === carouselItems.length - 1 ? 0 : prev + 1
                              )
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            aria-label="Siguiente"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}

                      {/* Indicadores de página - Posicionados para no interferir con controles de video */}
                      {carouselItems.length > 1 && (
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
                          {carouselItems.map((_, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation()
                                setCurrentVideoIndex(index)
                              }}
                              className={`h-2 rounded-full transition-all pointer-events-auto ${
                                index === currentVideoIndex
                                  ? 'w-8 bg-white'
                                  : 'w-2 bg-white/50 hover:bg-white/75'
                              }`}
                              aria-label={`Ir a item ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">No hay contenido premium disponible</p>
                  </div>
                )}
            </div>
          </>
        ) : (
          /* Contenido Normal */
          <>
            {/* Imagen de Preview */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Imagen preview</h3>
              <div className="relative w-full h-64 overflow-hidden rounded-lg bg-muted group">
                {(() => {
                  // Para bundles: verificar si hay imágenes válidas (preview o detalle)
                  if (isBundle) {
                    const hasPreview = product.image && typeof product.image === 'string' && 
                                      product.image.trim() !== '' && 
                                      product.image !== '/empty.jpeg' && 
                                      !product.image.includes('empty') &&
                                      product.image !== '/img/empty.jpeg';
                    const hasDetailImages = product.bundleDetailImages && 
                                          product.bundleDetailImages.length > 0 &&
                                          product.bundleDetailImages.some(url => 
                                            url && typeof url === 'string' && 
                                            url.trim() !== '' && 
                                            url !== '/empty.jpeg' && 
                                            !url.includes('empty')
                                          );
                    
                    // Si no hay preview válido ni imágenes de detalle, mostrar placeholder "Sin imagen"
                    if (!hasPreview && !hasDetailImages) {
                      return (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            Sin imagen
                          </span>
                        </div>
                      );
                    }
                    
                    // Si hay preview válido, usarlo; si no, usar la primera imagen de detalle válida
                    const previewImage = hasPreview 
                      ? (product.image as string)
                      : (hasDetailImages ? product.bundleDetailImages!.find(url => 
                          url && typeof url === 'string' && 
                          url.trim() !== '' && 
                          url !== '/empty.jpeg' && 
                          !url.includes('empty')
                        ) : undefined);
                    
                    // Si aún no hay imagen válida, mostrar placeholder
                    if (!previewImage) {
                      return (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            Sin imagen
                          </span>
                        </div>
                      );
                    }
                    
                    return (
                      <Image
                        key={product.sku || product.id || 'bundle-preview'}
                        src={previewImage}
                        alt={product.name}
                        fill
                        priority
                        className="object-contain"
                      />
                    );
                  }
                  
                  // Para productos normales, usar currentImage como antes
                  if (typeof currentImage === 'string') {
                    // Verificar si es una imagen válida
                    const isValidImage = currentImage.trim() !== '' && 
                                        currentImage !== '/empty.jpeg' && 
                                        !currentImage.includes('empty');
                    
                    if (!isValidImage) {
                      return (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            Sin imagen
                          </span>
                        </div>
                      );
                    }
                    
                    return (
                      <Image
                        key={selectedColor?.sku || 'default'}
                        src={currentImage}
                        alt={`${product.name} - ${selectedColor?.label || ''}`}
                        fill
                        priority
                        className="object-contain"
                      />
                    );
                  }
                  
                  // Para StaticImageData, usar directamente
                  return (
                    <Image
                      key={selectedColor?.sku || 'default'}
                      src={currentImage}
                      alt={`${product.name} - ${selectedColor?.label || ''}`}
                      fill
                      className="object-contain"
                      priority
                    />
                  );
                })()}
              </div>
            </div>

            {/* Imágenes detalladas - Carrusel (siempre mostrar, con placeholder si no hay imágenes) */}
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Imágenes de detalle</h3>
              {(() => {
                // Obtener imágenes válidas (filtrar vacías, null, undefined, y empty.jpeg)
                const detailImages = isBundle && product.bundleDetailImages
                  ? product.bundleDetailImages.filter(url => url && typeof url === 'string' && url.trim() !== '' && url !== '/empty.jpeg' && !url.includes('empty') && !url.includes('empty.jpeg'))
                  : selectedColor?.imageDetailsUrls?.filter(url => url && typeof url === 'string' && url.trim() !== '' && url !== '/empty.jpeg' && !url.includes('empty') && !url.includes('empty.jpeg')) || [];
                
                // Si no hay imágenes válidas, mostrar placeholder "Sin imagen"
                if (detailImages.length === 0) {
                  return (
                    <div className="relative w-full h-64 overflow-hidden rounded-lg bg-muted group">
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          Sin imagen
                        </span>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <>
                    <div className="relative w-full h-64 overflow-hidden rounded-lg bg-muted group">
                      <Image
                        src={detailImages[currentImageIndex] || detailImages[0]}
                        alt={
                          isBundle
                            ? `${product.name} - Detalle ${currentImageIndex + 1}`
                            : `${product.name} - ${selectedColor?.label || ''} - Detalle ${currentImageIndex + 1}`
                        }
                        fill
                        className="object-contain"
                      />

                    {/* Botones de navegación */}
                    {detailImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex((prev) =>
                            prev === 0 ? detailImages.length - 1 : prev - 1
                          )}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((prev) =>
                            prev === detailImages.length - 1 ? 0 : prev + 1
                          )}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    {/* Indicadores de página */}
                    {detailImages.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {detailImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`h-2 rounded-full transition-all ${
                              index === currentImageIndex
                                ? 'w-8 bg-white'
                                : 'w-2 bg-white/50 hover:bg-white/75'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                    {/* Miniaturas */}
                    <div className="flex gap-2 overflow-x-auto pb-2 pt-2 pl-2">
                      {detailImages.map((url, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative flex-shrink-0 w-20 h-20 overflow-hidden rounded-lg border-2 transition-all ${
                            index === currentImageIndex
                              ? 'border-primary ring-2 ring-primary ring-offset-2'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Image
                            src={url}
                            alt={`${product.name} - Miniatura ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </>
        )}

        {/* Badges */}
        <div className="mt-4 flex gap-2">
          {product.isNew && (
            <Badge variant="default">Nuevo</Badge>
          )}
          {/* No mostrar badge de descuento para bundles (se muestra en PriceDisplay) */}
          {!isBundle && currentDiscount && (
            <Badge variant="destructive">{currentDiscount}</Badge>
          )}
          {/* No mostrar badge de stock para bundles (no tienen stock individual) */}
          {!isBundle && (
            currentStock > 0 ? (
              <Badge variant="default">En stock ({currentStock})</Badge>
            ) : (
              <Badge variant="secondary">Agotado</Badge>
            )
          )}
          {isBundle && (
            <Badge variant="secondary">Agotado</Badge>
          )}
        </div>

        {/* Modal de edición de imágenes normales */}
        <EditImagesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
          selectedColor={selectedColor}
          isPremiumMode={isPremiumMode}
        />

        {/* Modal de edición de contenido premium */}
        <EditPremiumModal
          isOpen={isPremiumModalOpen}
          onClose={() => setIsPremiumModalOpen(false)}
          product={product}
          selectedColor={selectedColor}
        />
      </CardContent>
    </Card>
  )
}
