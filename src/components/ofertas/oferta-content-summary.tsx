import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Image as ImageIcon, MessageSquare, Grid, Info } from "lucide-react"

interface OfertaContentSummaryProps {
  bannersCount: number
  sectionsCount: number
  infoItemsCount: number
  faqItemsCount: number
  infoEnabled: boolean
  faqEnabled: boolean
}

export function OfertaContentSummary({
  bannersCount,
  sectionsCount,
  infoItemsCount,
  faqItemsCount,
  infoEnabled,
  faqEnabled,
}: OfertaContentSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Contenido de la Landing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Banners Carrusel</span>
          </div>
          <Badge variant="secondary">{bannersCount}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Secciones de Productos</span>
          </div>
          <Badge variant="secondary">{sectionsCount}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Bloques Informativos</span>
          </div>
          <div className="flex items-center gap-2">
            {infoEnabled ? (
              <Badge variant="default">{infoItemsCount}</Badge>
            ) : (
              <Badge variant="outline">Desactivado</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Preguntas FAQ</span>
          </div>
          <div className="flex items-center gap-2">
            {faqEnabled ? (
              <Badge variant="default">{faqItemsCount}</Badge>
            ) : (
              <Badge variant="outline">Desactivado</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
