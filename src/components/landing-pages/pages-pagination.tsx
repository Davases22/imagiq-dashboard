import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { PAGE_SIZE_OPTIONS } from "@/types/landing-page"
import type { PaginationState } from "@/types/landing-page"

interface PagesPaginationProps {
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onNextPage: () => void
  onPreviousPage: () => void
}

/**
 * Controles de paginación para landing pages
 *
 * Características:
 * - Selector de tamaño de página (5, 10, 15, 20)
 * - Navegación anterior/siguiente
 * - Muestra información de página actual
 */
export function PagesPagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  onNextPage,
  onPreviousPage,
}: PagesPaginationProps) {
  const { currentPage, totalPages, total, pageSize } = pagination

  // Calcular rango de items mostrados
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, total)

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground">
        Mostrando {startItem} a {endItem} de {total} páginas
      </div>

      <div className="flex items-center space-x-6 lg:space-x-8">
        {/* Selector de tamaño de página */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Páginas por página</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Información de página actual */}
        <div className="flex w-[120px] items-center justify-center text-sm font-medium">
          Página {currentPage} de {totalPages}
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={onPreviousPage}
            disabled={currentPage <= 1}
          >
            <span className="sr-only">Página anterior</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
          >
            <span className="sr-only">Página siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
