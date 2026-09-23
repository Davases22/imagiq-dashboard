"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Mail,
  CheckCircle2,
  Bell,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductCardProps } from "@/features/products/useProducts";
import { GroupedNotificationsResponse, NotificationProducto, productEndpoints } from "@/lib/api";

// Componente de switch con estado, color verde y llamada al API
function VisibilitySwitch({
  defaultValue,
  sku,
  field,
}: {
  defaultValue: boolean;
  sku: string;
  field: "visibleStaging" | "visibleProduction";
}) {
  const [checked, setChecked] = useState(defaultValue);
  const [loading, setLoading] = useState(false);

  // Sincronizar estado cuando los datos del servidor cambian (paginación, refetch)
  useEffect(() => {
    setChecked(defaultValue);
  }, [defaultValue]);

  const handleChange = async (value: boolean) => {
    setChecked(value);
    setLoading(true);
    try {
      const response = await productEndpoints.updateVisibility(sku, { [field]: value });
      if (!response.success) {
        console.error("Error updating visibility:", response.message);
        setChecked(!value); // Revert on error
      }
    } catch (error) {
      console.error("Error updating visibility:", error);
      setChecked(!value); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <Switch
        checked={checked}
        onCheckedChange={handleChange}
        disabled={loading}
        className={checked ? "data-[state=checked]:bg-green-500" : ""}
      />
    </div>
  );
}

// Componente separado para la celda de acciones que usa useRouter
/**
 * Menú de acciones de cada fila.
 *
 * En la pantalla de notificaciones la única acción es abrir las solicitudes de
 * aviso; el resto del menú (editar, órdenes) pertenece al listado general.
 */
function ActionsCell({
  product,
  notificationData,
  notificationsOnly = false,
}: {
  product: ProductCardProps;
  notificationData?: NotificationProducto | null;
  notificationsOnly?: boolean;
}) {
  const router = useRouter();

  // En modo solo notificaciones, una fila sin solicitudes no tiene menú.
  if (notificationsOnly && !notificationData) {
    return null;
  }

  const skuAvisos = notificationData?.sku ?? product.sku;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!notificationsOnly && (
            <>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(product.id)}
              >
                Copiar ID del producto
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/productos/${product.id}`)}
              >
                Ver/Editar detalles
              </DropdownMenuItem>
            </>
          )}

          {notificationData && skuAvisos && (
            <>
              {!notificationsOnly && <DropdownMenuSeparator />}
              <DropdownMenuLabel>Avisos de disponibilidad</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/productos/notificaciones/${encodeURIComponent(skuAvisos)}` +
                      `?nombre=${encodeURIComponent(product.name)}`,
                  )
                }
              >
                <Mail className="mr-2 h-4 w-4" />
                Ver más detalle ({notificationData.totalNotificaciones})
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export const createProductColumns = (
  onSortChange?: (field: string, direction: "desc" | "asc") => void,
  notificationsData?: GroupedNotificationsResponse | null,
  notificationsOnly: boolean = false,
): ColumnDef<ProductCardProps>[] => {
  const baseColumns: ColumnDef<ProductCardProps>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todo"
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
      accessorKey: "image",
      header: "Imagen",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="w-16 h-16 relative overflow-hidden rounded-lg">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  Sin imagen
                </span>
              </div>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
              const isAsc = column.getIsSorted() === "asc";
              const newDirection = isAsc ? "desc" : "asc";
              column.toggleSorting(isAsc);
              onSortChange?.("name", newDirection);
            }}
          >
            Nombre
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const product = row.original;
        return (
          <TooltipProvider>
            <div className="max-w-[200px]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="font-medium truncate cursor-default">
                    {product.name}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{product.name}</p>
                </TooltipContent>
              </Tooltip>
              <div className="text-sm text-muted-foreground truncate">
                {product.description}
              </div>
            </div>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Categoría",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="w-fit">
              {product.category || "Sin categoría"}
            </Badge>
            {/* {product.menu && (
            <span className="text-xs text-muted-foreground">
              {product.menu}
            </span>
          )} */}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "menu",
      header: "Menú",
      cell: ({ row }) => {
        const product = row.original;
        return <div className="flex flex-col gap-1">{product.menu}</div>;
      },
      filterFn: (row, id, value) => {
        const menuValue = row.getValue(id) as string;
        return value.includes(menuValue);
      },
      enableSorting: false,
      enableHiding: false,
      size: 0, // Tamaño 0 para que no ocupe espacio
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
              const isAsc = column.getIsSorted() === "asc";
              const newDirection = isAsc ? "desc" : "asc";
              column.toggleSorting(isAsc);
              onSortChange?.("price", newDirection);
            }}
          >
            Precio
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const price = row.getValue("price") as string;
        return <div className="font-medium">{price || "N/A"}</div>;
      },
    },
    {
      accessorKey: "stockTotal",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            // onClick={() => {
            //   const currentSort = column.getIsSorted()
            //   // Si está en desc, cambiar a asc. Si no está ordenado o está en asc, ir a desc
            //   const isDesc = currentSort === "desc"
            //   const newDirection = isDesc ? "asc" : "desc"
            //   // toggleSorting(true) = desc, toggleSorting(false) = asc
            //   column.toggleSorting(!isDesc)
            //   onSortChange?.("stock", newDirection)
            // }}
          >
            Stock
            {/* <ArrowUpDown className="ml-2 h-4 w-4" /> */}
          </Button>
        );
      },
      cell: ({ row }) => {
        const stock = row.getValue("stockTotal") as number | undefined;

        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{stock ?? 0}</span>
            {stock !== undefined && stock <= 10 && (
              <Badge variant="destructive">Bajo</Badge>
            )}
          </div>
        );
      },
    },
    // {
    //   accessorKey: "status",
    //   header: "Estado",
    //   cell: ({ row }) => {
    //     const stock = row.original.stock
    //     const status = (stock ?? 0) > 0 ? "active" : "inactive"
    //     return (
    //       <Badge
    //         variant={
    //           status === "active"
    //             ? "default"
    //             : "secondary"
    //         }
    //       >
    //         {status === "active" ? "Activo" : "Inactivo"}
    //       </Badge>
    //     )
    //   },
    //   filterFn: (row, id, value) => {
    //     const stock = row.original.stock
    //     const status = (stock ?? 0) > 0 ? "active" : "inactive"
    //     return value.includes(status)
    //   },
    // },
    {
      id: "staging",
      header: "Staging",
      cell: ({ row }) => {
        const product = row.original;
        const firstSku = product.colors?.[0]?.sku || product.sku?.split(", ")[0] || "";
        return (
          <VisibilitySwitch
            defaultValue={product.visibleStaging ?? false}
            sku={firstSku}
            field="visibleStaging"
          />
        );
      },
      enableSorting: false,
    },
    {
      id: "production",
      header: "Producción",
      cell: ({ row }) => {
        const product = row.original;
        const firstSku = product.colors?.[0]?.sku || product.sku?.split(", ")[0] || "";
        return (
          <VisibilitySwitch
            defaultValue={product.visibleProduction ?? false}
            sku={firstSku}
            field="visibleProduction"
          />
        );
      },
      enableSorting: false,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original;

        // Buscar datos de notificaciones para este producto
        let notificationData: NotificationProducto | null = null;
        if (notificationsData) {
          // Buscar en todos los grupos de notificaciones
          for (const group of notificationsData.notificaciones) {
            // Buscar el producto por SKU en los productos del grupo
            const foundProduct = group.productos.find(
              (p) => product.sku && p.sku === product.sku,
            );
            if (foundProduct) {
              notificationData = foundProduct;
              break;
            }
          }
        }

        return (
          <ActionsCell
            product={product}
            notificationData={notificationData}
            notificationsOnly={notificationsOnly}
          />
        );
      },
    },
  ];

  const solicitudesColumn: ColumnDef<ProductCardProps> = {
    id: "solicitudes",
    header: ({ column }) => {
      return (
        <div className="flex items-center justify-center w-full">
          <Button
            variant="ghost"
            className="h-8"
            onClick={() => {
              const isAsc = column.getIsSorted() === "asc";
              column.toggleSorting(isAsc);
            }}
          >
            <Bell className="mr-1.5 h-4 w-4" />
            Solicitudes
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const product = row.original;

      // Buscar datos de notificaciones para este producto
      let notificationData: NotificationProducto | null = null;
      if (notificationsData) {
        // Buscar en todos los grupos de notificaciones
        for (const group of notificationsData.notificaciones) {
          // Buscar el producto por SKU en los productos del grupo
          const foundProduct = group.productos.find(
            (p) => product.sku && p.sku === product.sku,
          );
          if (foundProduct) {
            notificationData = foundProduct;
            break;
          }
        }
      }

      const pendientes = notificationData?.notificacionesPendientes || 0;
      const enviadas = notificationData?.notificacionesEnviadas || 0;

      // Si hay datos de notificaciones, mostrar ambos badges (incluso si uno es 0)
      if (notificationData) {
        return (
          <div className="flex items-center justify-center gap-2">
            <Badge
              variant="outline"
              className={`flex items-center gap-1 ${
                pendientes > 0
                  ? "border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/20"
                  : "border-gray-300 text-gray-500 bg-gray-50 dark:bg-gray-950/20"
              }`}
            >
              <Mail className="h-3 w-3" />
              <span>Pendiente</span>
              <span className="font-semibold">{pendientes}</span>
            </Badge>
            <Badge
              variant="outline"
              className={`flex items-center gap-1 ${
                enviadas > 0
                  ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20"
                  : "border-gray-300 text-gray-500 bg-gray-50 dark:bg-gray-950/20"
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Enviada</span>
              <span className="font-semibold">{enviadas}</span>
            </Badge>
          </div>
        );
      }

      // Si no hay datos de notificaciones
      return (
        <div className="flex items-center justify-center">
          <span className="text-sm text-muted-foreground">-</span>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const productA = rowA.original;
      const productB = rowB.original;

      // Buscar datos de notificaciones para cada producto
      let notificationDataA: NotificationProducto | null = null;
      let notificationDataB: NotificationProducto | null = null;

      if (notificationsData) {
        for (const group of notificationsData.notificaciones) {
          const foundA = group.productos.find(
            (p) => productA.sku && p.sku === productA.sku,
          );
          if (foundA) {
            notificationDataA = foundA;
            break;
          }
        }
        for (const group of notificationsData.notificaciones) {
          const foundB = group.productos.find(
            (p) => productB.sku && p.sku === productB.sku,
          );
          if (foundB) {
            notificationDataB = foundB;
            break;
          }
        }
      }

      const totalA = notificationDataA?.totalNotificaciones || 0;
      const totalB = notificationDataB?.totalNotificaciones || 0;

      return totalA - totalB;
    },
  };

  // Si notificationsOnly es true, insertar la columna de solicitudes antes de la columna de acciones
  if (notificationsOnly) {
    const actionsIndex = baseColumns.findIndex((col) => col.id === "actions");
    if (actionsIndex !== -1) {
      baseColumns.splice(actionsIndex, 0, solicitudesColumn);
    }
  }

  return baseColumns;
};
