"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Trash2, Eye, EyeOff, ArrowUpDown, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Page } from "@/types/page"
import {
  PAGE_STATUS_LABELS,
  PAGE_STATUS_COLORS,
} from "@/types/landing-page"

/**
 * Props del componente FormPagesTable
 */
interface FormPagesTableProps {
  pages: Page[]
  onToggleActive: (page: Page) => void
  onEdit: (id: string) => void
  onViewResponses: (id: string) => void
  onDelete: (page: Page) => void
}

/**
 * Tipo de ordenamiento
 */
type SortField = "title" | "created_at" | "updated_at"
type SortOrder = "asc" | "desc"

/**
 * Tabla de formularios con filtros y ordenamiento
 *
 * Características:
 * - Filtros por búsqueda de título
 * - Ordenamiento por columnas
 * - Acciones: editar, ver respuestas, eliminar, toggle activo
 * - Muestra: título, estado, campos, fecha, estado activo
 */
export function FormPagesTable({
  pages,
  onToggleActive,
  onEdit,
  onViewResponses,
  onDelete,
}: FormPagesTableProps) {
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("")

  // Estados para ordenamiento
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  /**
   * Formatear fecha a formato legible en español
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  /**
   * Toggle ordenamiento de una columna
   */
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  /**
   * Contar número de campos del formulario
   */
  const countFormFields = (page: Page): number => {
    if (!page.form_config?.fields) return 0
    return page.form_config.fields.length
  }

  /**
   * Filtrar y ordenar páginas
   */
  const filteredAndSortedPages = pages
    .filter((page) => {
      // Filtro por búsqueda de título
      const matchesSearch = page.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

      return matchesSearch
    })
    .sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "created_at":
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case "updated_at":
          aValue = new Date(a.updated_at).getTime()
          bValue = new Date(b.updated_at).getTime()
          break
        default:
          return 0
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">
            Buscar por título
          </label>
          <Input
            placeholder="Buscar formularios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm("")
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => toggleSort("title")}
                  className="h-8 px-2"
                >
                  Título
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center">Campos</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => toggleSort("created_at")}
                  className="h-8 px-2"
                >
                  Fecha Creación
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-center">Activo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedPages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron formularios
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedPages.map((page) => (
                <TableRow key={page.id}>
                  {/* Título */}
                  <TableCell>
                    <div className="font-medium">{page.title}</div>
                    {page.slug && (
                      <div className="text-xs text-muted-foreground">
                        /{page.slug}
                      </div>
                    )}
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <Badge variant={PAGE_STATUS_COLORS[page.status]}>
                      {PAGE_STATUS_LABELS[page.status]}
                    </Badge>
                  </TableCell>

                  {/* Número de Campos */}
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {countFormFields(page)}
                    </Badge>
                  </TableCell>

                  {/* Fecha de Creación */}
                  <TableCell>
                    <div className="text-sm">{formatDate(page.created_at)}</div>
                  </TableCell>

                  {/* Toggle Activo */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={page.is_active}
                        onCheckedChange={() => onToggleActive(page)}
                      />
                      {page.is_active ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(page.id)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewResponses(page.id)}
                        title="Ver respuestas"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(page)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
