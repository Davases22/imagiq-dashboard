"use client";

import { Info, Monitor, Smartphone, Image as ImageIcon, Video } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BannerSizeGuideProps {
  readonly placement: string;
}

interface SizeSpec {
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: string;
  readonly maxSize: string;
  readonly notes?: string;
}

interface PlacementSpecs {
  readonly title: string;
  readonly description: string;
  readonly desktop?: SizeSpec;
  readonly mobile?: SizeSpec;
}

const BANNER_SPECS: Record<string, PlacementSpecs> = {
  hero: {
    title: "Hero Banner (Banner Principal)",
    description: "Banner de pantalla completa con efecto de reducción al scroll",
    desktop: {
      width: 1920,
      height: 1080,
      aspectRatio: "16:9",
      maxSize: "1MB para imágenes, 5MB para videos",
      notes: "Área segura para texto: Centro o según sistema grid 8x8"
    },
    mobile: {
      width: 1080,
      height: 1920,
      aspectRatio: "9:16",
      maxSize: "500KB para imágenes, 3MB para videos",
      notes: "Área segura para texto: Centro con padding 10% cada lado"
    }
  },
  "home-2": {
    title: "Home Banner 2 (Intermedio)",
    description: "Banner intermedio para la página principal",
    desktop: {
      width: 1440,
      height: 800,
      aspectRatio: "9:5",
      maxSize: "800KB para imágenes, 4MB para videos",
      notes: "Ancho máximo: 1440px centrado"
    },
    mobile: {
      width: 1080,
      height: 1400,
      aspectRatio: "27:35",
      maxSize: "500KB para imágenes, 2.5MB para videos",
      notes: "Altura mínima: 700px"
    }
  },
  "home-3": {
    title: "Home Banner 3 (Intermedio)",
    description: "Banner intermedio para la página principal",
    desktop: {
      width: 1440,
      height: 800,
      aspectRatio: "9:5",
      maxSize: "800KB para imágenes, 4MB para videos",
      notes: "Ancho máximo: 1440px centrado"
    },
    mobile: {
      width: 1080,
      height: 1400,
      aspectRatio: "27:35",
      maxSize: "500KB para imágenes, 2.5MB para videos",
      notes: "Altura mínima: 700px"
    }
  },
  "home-4": {
    title: "Home Banner 4 (Intermedio)",
    description: "Banner intermedio para la página principal",
    desktop: {
      width: 1440,
      height: 800,
      aspectRatio: "9:5",
      maxSize: "800KB para imágenes, 4MB para videos",
      notes: "Ancho máximo: 1440px centrado"
    },
    mobile: {
      width: 1080,
      height: 1400,
      aspectRatio: "27:35",
      maxSize: "500KB para imágenes, 2.5MB para videos",
      notes: "Altura mínima: 700px"
    }
  },
  "category-banner": {
    title: "Banner de Categoría",
    description: "Banner vertical para páginas de categorías",
    desktop: {
      width: 1080,
      height: 1944,
      aspectRatio: "9:16",
      maxSize: "500KB para imágenes, 3MB para videos",
      notes: "Formato vertical tipo stories"
    }
  }
};

function SizeSpecCard({ title, spec, icon: Icon }: { readonly title: string; readonly spec: SizeSpec; readonly icon: React.ElementType }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium text-sm">{title}</h4>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{spec.width} × {spec.height}</span>
          <span className="text-xs text-muted-foreground">píxeles</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Aspecto:</span>
            <span className="ml-1 font-medium">{spec.aspectRatio}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Peso máx:</span>
            <span className="ml-1 font-medium">{spec.maxSize}</span>
          </div>
        </div>

        {spec.notes && (
          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
            {spec.notes}
          </p>
        )}
      </div>
    </div>
  );
}

export function BannerSizeGuide({ placement }: BannerSizeGuideProps) {
  // Determinar el tipo de banner basado en el placement
  let specKey = placement;

  // Para banners de categoría (que empiezan con "banner-" o son "category-top")
  if (placement.startsWith("banner-") || placement === "category-top") {
    specKey = "category-banner";
  }

  const specs = BANNER_SPECS[specKey];

  // Si no hay specs para este placement, no mostrar nada
  if (!specs) {
    return null;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="size-guide" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="font-medium">Guía de Dimensiones y Especificaciones</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          {/* Título y descripción */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{specs.title}</h3>
            <p className="text-sm text-muted-foreground">{specs.description}</p>
          </div>

          {/* Especificaciones de tamaño */}
          <div className="grid gap-4 md:grid-cols-2">
            {specs.desktop && (
              <SizeSpecCard
                title="Desktop"
                spec={specs.desktop}
                icon={Monitor}
              />
            )}
            {specs.mobile && (
              <SizeSpecCard
                title="Mobile"
                spec={specs.mobile}
                icon={Smartphone}
              />
            )}
          </div>

          {/* Formatos soportados */}
          <Alert>
            <AlertDescription className="flex items-start gap-2 text-xs">
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span><strong>Imágenes:</strong> JPG, PNG, WebP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-muted-foreground" />
                  <span><strong>Videos:</strong> MP4, WebM</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Recomendación final */}
          <div className="rounded-lg bg-primary/5 p-3 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Recomendación:</strong> Optimiza tus imágenes antes de subirlas para mejorar el tiempo de carga.
              Usa herramientas como TinyPNG o Squoosh para reducir el peso sin perder calidad.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
