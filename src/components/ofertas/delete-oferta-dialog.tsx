import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Oferta {
  id: string
  titulo: string
}

interface DeleteOfertaDialogProps {
  oferta: Oferta | null
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteOfertaDialog({ oferta, onConfirm, onCancel }: DeleteOfertaDialogProps) {
  return (
    <AlertDialog open={!!oferta} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar oferta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. La oferta &quot;{oferta?.titulo}&quot; será
            eliminada permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
