import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Eye, Archive } from "lucide-react"
import type { Page } from "@/types/page"

interface PagesStatsProps {
  pages: Page[]
}

/**
 * Componente de estadísticas para landing pages
 *
 * Muestra:
 * - Total de páginas
 * - Páginas publicadas
 * - Páginas archivadas
 */
export function PagesStats({ pages }: PagesStatsProps) {
  const total = pages.length
  const published = pages.filter((p) => p.status === "published").length
  const archived = pages.filter((p) => p.status === "archived").length

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Páginas</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">
            Todas las landing pages
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Publicadas</CardTitle>
          <Eye className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{published}</div>
          <p className="text-xs text-muted-foreground">
            Visibles para usuarios
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Archivadas</CardTitle>
          <Archive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{archived}</div>
          <p className="text-xs text-muted-foreground">
            No visibles actualmente
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
