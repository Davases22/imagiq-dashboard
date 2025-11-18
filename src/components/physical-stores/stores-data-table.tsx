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
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Eye, Settings, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackendTienda } from "@/lib/api";

interface StoresDataTableProps {
  stores: BackendTienda[];
  onViewStore: (store: BackendTienda) => void;
  onManageOrders: (store: BackendTienda) => void;
  onStoreSettings: (store: BackendTienda) => void;
}

export function StoresDataTable({
  stores,
  onViewStore,
  onManageOrders,
  onStoreSettings,
}: StoresDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns: ColumnDef<BackendTienda>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "codigo",
      header: "Código",
      cell: ({ row }) => (
        <div className="font-mono font-medium">{row.getValue("codigo")}</div>
      ),
    },
    {
      id: "descripcion",
      accessorFn: (row) => row.descripcion,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tienda
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const store = row.original;
        return (
          <div>
            <div className="font-medium">{store.descripcion || '-'}</div>
            <div className="text-sm text-muted-foreground">
              {store.ciudad || ''}{store.departamento ? `, ${store.departamento}` : ''}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "direccion",
      header: "Dirección",
      cell: ({ row }) => {
        const store = row.original;
        return (
          <div>
            <div className="text-sm">{store.direccion || '-'}</div>
            {store.ubicacion_cc && (
              <div className="text-xs text-muted-foreground">
                {store.ubicacion_cc}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "horario",
      header: "Horario",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("horario") || '-'}</div>
      ),
    },
    {
      id: "contacto",
      header: "Contacto",
      cell: ({ row }) => {
        const store = row.original;
        return (
          <div className="space-y-1">
            {store.telefono && (
              <div className="text-sm">
                {store.telefono}{store.extension ? ` ext. ${store.extension}` : ''}
              </div>
            )}
            {store.email && (
              <div className="text-xs text-muted-foreground">
                {store.email}
              </div>
            )}
            {!store.telefono && !store.email && (
              <div className="text-muted-foreground">-</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "codBodega",
      header: "Cod. Bodega",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("codBodega")}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const store = row.original;

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
              <DropdownMenuItem onClick={() => onViewStore(store)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageOrders(store)}>
                <Package className="mr-2 h-4 w-4" />
                Gestionar Órdenes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStoreSettings(store)}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: stores,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Buscar tiendas..."
          value={(table.getColumn("descripcion")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("descripcion")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron tiendas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <span>
              {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
            </span>
          )}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Filas por página</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a primera página</span>
              <span>{'<<'}</span>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a página anterior</span>
              <span>{'<'}</span>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir a página siguiente</span>
              <span>{'>'}</span>
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir a última página</span>
              <span>{'>>'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}