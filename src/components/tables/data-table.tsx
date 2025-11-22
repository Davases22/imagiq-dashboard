"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useState, useEffect } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  filters?: Array<{
    id: string
    title: string
    options: Array<{
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
    }>
    singleSelect?: boolean
  }>
  // Paginación del servidor
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void
  totalItems?: number
  // Filtros del servidor
  onSearchChange?: (search: string) => void
  onFilterChange?: (filterId: string, value: string[]) => void
  initialFilterValues?: Record<string, string[]>
  initialSearchValue?: string
  // Estado de carga
  loading?: boolean
  // Visibilidad inicial de columnas
  initialColumnVisibility?: VisibilityState
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  filters,
  pageCount,
  pageIndex: controlledPageIndex,
  pageSize: controlledPageSize,
  onPaginationChange,
  totalItems,
  onSearchChange,
  onFilterChange,
  initialFilterValues,
  initialSearchValue,
  loading = false,
  initialColumnVisibility,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialColumnVisibility ?? {})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Usar paginación controlada si se proporciona
  const [pagination, setPagination] = useState({
    pageIndex: controlledPageIndex ?? 0,
    pageSize: controlledPageSize ?? 10,
  })

  // Sincronizar paginación cuando cambien los valores controlados (especialmente cuando cambia viewMode)
  useEffect(() => {
    if (controlledPageIndex !== undefined || controlledPageSize !== undefined) {
      setPagination({
        pageIndex: controlledPageIndex ?? 0,
        pageSize: controlledPageSize ?? 10,
      })
    }
  }, [controlledPageIndex, controlledPageSize])

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater
      setPagination(newPagination)
      onPaginationChange?.(newPagination)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pageCount ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: !!pageCount,
    manualSorting: !!onPaginationChange, // Solo manual si hay paginación del servidor
    manualFiltering: !!onFilterChange, // Solo manual si hay filtrado del servidor
    autoResetPageIndex: false, // FIX: Evitar reset automático que causa ciclos infinitos con resultados vacíos
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        filters={filters}
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
        initialFilterValues={initialFilterValues}
        initialSearchValue={initialSearchValue}
      />
      {loading ? (
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((_, index) => (
                    <TableHead key={index}>
                      <Skeleton className="h-4 w-full" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-2">
            <Skeleton className="h-8 w-[180px]" />
            <div className="flex items-center space-x-6 lg:space-x-8">
              <Skeleton className="h-8 w-[100px]" />
              <Skeleton className="h-8 w-[100px]" />
              <Skeleton className="h-8 w-[150px]" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="w-full overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const columnSize = header.getSize();
                      const isPlantillaColumn = header.column.id === 'name';
                      return (
                        <TableHead 
                          key={header.id}
                          style={{ 
                            width: columnSize !== 150 ? `${columnSize}px` : undefined,
                            minWidth: columnSize !== 150 ? `${columnSize}px` : undefined,
                            maxWidth: isPlantillaColumn ? `${columnSize}px` : undefined
                          }}
                          className={isPlantillaColumn ? '!whitespace-normal' : ''}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
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
                      {row.getVisibleCells().map((cell) => {
                        const columnSize = cell.column.getSize();
                        const isPlantillaColumn = cell.column.id === 'name';
                        return (
                          <TableCell 
                            key={cell.id}
                            style={{ 
                              width: columnSize !== 150 ? `${columnSize}px` : undefined,
                              minWidth: columnSize !== 150 ? `${columnSize}px` : undefined,
                              maxWidth: isPlantillaColumn ? `${columnSize}px` : undefined
                            }}
                            className={isPlantillaColumn ? '!whitespace-normal' : ''}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} totalItems={totalItems} />
        </>
      )}
    </div>
  )
}