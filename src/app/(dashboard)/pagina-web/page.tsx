"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutGrid,
  FolderTree,
  Settings,
  TrendingUp,
  Eye,
  MousePointer,
  ArrowRight,
  Filter,
  Tag,
  ClipboardList,
} from "lucide-react"

export default function PaginaWebPage() {
  const router = useRouter()

  const sections = [
    {
      id: "categorias",
      title: "Categorías y Subcategorías",
      description: "Gestiona las categorías y subcategorías que aparecen en tu sitio web",
      icon: FolderTree,
      path: "/pagina-web/categorias",
      available: true,
    },
    {
      id: "filtros",
      title: "Filtros Dinámicos",
      description: "Configura filtros dinámicos para productos (precio, color, almacenamiento, etc.)",
      icon: Filter,
      path: "/pagina-web/filtros",
      available: true,
    },
    {
      id: "landing-pages",
      title: "Páginas Dinámicas",
      description: "Gestiona landing pages, ofertas especiales y promociones de tu sitio web",
      icon: Tag,
      path: "/pagina-web/landing-pages",
      available: true,
    },
    {
      id: "formularios",
      title: "Formularios",
      description: "Crea landing pages con formularios de captura de leads, contacto y encuestas",
      icon: ClipboardList,
      path: "/pagina-web/formularios",
      available: true,
    },
    {
      id: "navegacion",
      title: "Navegación y Menús",
      description: "Configura los menús de navegación principal y footer",
      icon: LayoutGrid,
      path: "/pagina-web/navegacion",
      available: false,
    },
    {
      id: "seo",
      title: "SEO y Metadatos",
      description: "Optimiza tu sitio para motores de búsqueda",
      icon: TrendingUp,
      path: "/pagina-web/seo",
      available: true,
    },
    {
      id: "configuracion",
      title: "Configuración General",
      description: "Logo, favicon, colores y ajustes generales del sitio",
      icon: Settings,
      path: "/pagina-web/configuracion",
      available: true,
    },
  ]

  // Métricas de la página web
  const metrics = [
    {
      title: "Categorías Activas",
      value: "12",
      subtitle: "8 con subcategorías",
      icon: FolderTree,
      trend: { value: "+2", isPositive: true },
    },
    {
      title: "Visitas del Sitio",
      value: "45,231",
      subtitle: "Último mes",
      icon: Eye,
      trend: { value: "+12.5%", isPositive: true },
    },
    {
      title: "Tasa de Interacción",
      value: "68%",
      subtitle: "Clicks en categorías",
      icon: MousePointer,
      trend: { value: "+5.2%", isPositive: true },
    },
    {
      title: "Tiempo en Sitio",
      value: "3:42",
      subtitle: "Promedio minutos",
      icon: TrendingUp,
      trend: { value: "+0:30", isPositive: true },
    },
  ]

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestión de Página Web</h1>
        <p className="text-sm text-muted-foreground">
          Administra el contenido y configuración de tu sitio web
        </p>
      </div>

      {/* Métricas */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                {metric.trend && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      metric.trend.isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {metric.trend.value}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secciones disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Secciones de Configuración</CardTitle>
          <CardDescription>
            Selecciona la sección que deseas gestionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {sections.map((section) => (
              <Card
                key={section.id}
                className={`${
                  section.available
                    ? "cursor-pointer transition-all hover:border-primary hover:bg-primary/5"
                    : "opacity-60"
                }`}
                onClick={() => {
                  if (section.available) {
                    router.push(section.path)
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {section.description}
                        </CardDescription>
                      </div>
                    </div>
                    {section.available ? (
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Próximamente
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
