import { Button } from "@/components/ui/button"
import { Plus, Tag } from "lucide-react"

interface EmptyOfertasStateProps {
  onCreateClick: () => void
}

export function EmptyOfertasState({ onCreateClick }: EmptyOfertasStateProps) {
  return (
    <div className="text-center py-8">
      <Tag className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground">No hay ofertas creadas todavía</p>
      <Button variant="outline" className="mt-4" onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Crear primera oferta
      </Button>
    </div>
  )
}
