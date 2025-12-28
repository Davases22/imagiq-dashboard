"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2, MoreHorizontal, Edit, Trash2, CheckCircle, XCircle, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useFaqs } from "@/hooks/use-faqs";
import { faqEndpoints } from "@/lib/api";
import { toast } from "sonner";
import { Faq } from "@/types/faq";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FaqsTableProps {
  onEdit: (id: string) => void;
  onRefetch: () => void;
}

export function FaqsTable({ onEdit, onRefetch }: FaqsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [faqToDelete, setFaqToDelete] = React.useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { faqs, isLoading, error, pagination, nextPage, previousPage, deleteFaq, refetch } = useFaqs({
    limit: 10,
  });

  const handleDeleteClick = (id: string) => {
    setFaqToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (faqToDelete) {
      const success = await deleteFaq(faqToDelete);
      if (success) {
        await refetch();
        onRefetch();
      }
    }
    setDeleteDialogOpen(false);
    setFaqToDelete(null);
  };

  const handleBulkDeleteClick = () => {
    const selectedCount = Object.keys(rowSelection).length;
    if (selectedCount > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const handleConfirmBulkDelete = async () => {
    setIsDeleting(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedFaqs = selectedRows.map((row) => row.original);

    try {
      // Eliminar todos los FAQs en paralelo
      const deletePromises = selectedFaqs.map((faq) => faqEndpoints.delete(faq.id));
      const results = await Promise.allSettled(deletePromises);

      const successCount = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
      const failedCount = selectedFaqs.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} FAQ(s) eliminado(s) exitosamente`);
      }
      if (failedCount > 0) {
        toast.error(`No se pudieron eliminar ${failedCount} FAQ(s)`);
      }
    } catch (error) {
      toast.error("Error al eliminar FAQs");
    } finally {
      setIsDeleting(false);
      setBulkDeleteDialogOpen(false);
      setRowSelection({});
      await refetch();
      // Solo refrescar una vez al final
      onRefetch();
    }
  };

  const columns: ColumnDef<Faq>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "pregunta",
      header: "Pregunta",
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <p className="font-medium line-clamp-2">{row.getValue("pregunta")}</p>
        </div>
      ),
    },
    {
      accessorKey: "respuesta",
      header: "Respuesta",
      cell: ({ row }) => (
        <div className="max-w-[400px]">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {row.getValue("respuesta")}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "activo",
      header: "Estado",
      cell: ({ row }) => {
        const activo = row.getValue("activo") as boolean;
        return (
          <Badge variant={activo ? "default" : "secondary"}>
            {activo ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                Activo
              </>
            ) : (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                Inactivo
              </>
            )}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Fecha de creación",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <span className="text-sm">{date.toLocaleDateString("es-CO")}</span>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const faq = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(faq.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(faq.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: faqs,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  if (error) {
    return (
      <div className="w-full">
        <div className="rounded-md border border-destructive p-8 text-center">
          <p className="text-destructive font-medium">Error al cargar los FAQs</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  let bodyContent: React.ReactNode;
  if (isLoading) {
    bodyContent = (
      <TableRow>
        <TableCell colSpan={columns.length} className="h-24 text-center">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Cargando FAQs...</span>
          </div>
        </TableCell>
      </TableRow>
    );
  } else if (table.getRowModel().rows?.length) {
    bodyContent = table.getRowModel().rows.map((row) => (
      <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  } else {
    bodyContent = (
      <TableRow>
        <TableCell colSpan={columns.length} className="h-24 text-center">
          No se encontraron FAQs.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      <div className="w-full space-y-4">
        {/* Filtro de búsqueda y acciones */}
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder="Buscar por pregunta..."
            value={(table.getColumn("pregunta")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("pregunta")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          {Object.keys(rowSelection).length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteClick}
            >
              <Trash className="mr-2 h-4 w-4" />
              Eliminar {Object.keys(rowSelection).length} seleccionado(s)
            </Button>
          )}
        </div>

        {/* Tabla */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>{bodyContent}</TableBody>
          </Table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {faqs.length} de {pagination.total} FAQs
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousPage}
              disabled={pagination.currentPage === 1 || isLoading}
            >
              Anterior
            </Button>
            <div className="text-sm">
              Página {pagination.currentPage} de {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={pagination.currentPage === pagination.totalPages || isLoading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El FAQ será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFaqToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {Object.keys(rowSelection).length} FAQ(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los FAQs seleccionados serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBulkDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
