"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { DataTable } from "@/components/tables/data-table";
import { createProductColumns } from "@/components/tables/columns/products-columns";
import { useProducts } from "@/features/products/useProducts";
import { categoryEndpoints, GroupedNotificationsResponse } from "@/lib/api";

const statuses = [
  { label: "Activo", value: "active" },
  { label: "Inactivo", value: "inactive" },
];

interface ProductsTableWrapperProps {
  filterBySku?: string[];
  /**
   * Filtro de existencias para la pantalla de avisos. Se aplica en el servidor
   * (stockMinimo/stockMaximo), no recortando lo ya traído, para que el conteo
   * y la paginación sigan siendo ciertos.
   */
  filtroStock?: "todos" | "con" | "sin";
  notificationsData?: GroupedNotificationsResponse | null;
  notificationsOnly?: boolean;
}

export function ProductsTableWrapper({ filterBySku, notificationsData, notificationsOnly = false, filtroStock = "todos" }: ProductsTableWrapperProps = {}) {
  const [pageSize, setPageSize] = useState(10);

  // Cargar filtros guardados desde localStorage (antes de cualquier petición)
  const getInitialFilters = (): Record<string, string[]> => {
    if (typeof window !== 'undefined') {
      const savedMenuFilter = localStorage.getItem('productsMenuFilter');
      if (savedMenuFilter) {
        try {
          const parsedFilter = JSON.parse(savedMenuFilter);
          if (Array.isArray(parsedFilter) && parsedFilter.length > 0) {
            return { menu: parsedFilter };
          }
        } catch (error) {
          console.error('Error parsing saved menu filter:', error);
        }
      }
    }
    return {};
  };

  const [currentFilters, setCurrentFilters] = useState<
    Record<string, string[]>
  >(getInitialFilters);

  const [searchQuery, setSearchQuery] = useState(() => {
    // Cargar búsqueda guardada desde localStorage
    if (typeof window !== 'undefined') {
      const savedSearch = localStorage.getItem('productsSearchQuery');
      return savedSearch || "";
    }
    return "";
  });
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState< "desc" | "asc" | undefined>();
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryEndpoints.getVisibleCompletas();
        const categoryOptions = response.data.flatMap(category =>
          category.menus
            .filter(menu => menu.nombre) // Filtrar menús vacíos
            .map(menu => ({
              label: menu.nombre,
              value: menu.nombre
            }))
        );
        console.log(categoryOptions)
        setCategories(categoryOptions);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const initialFilters = useMemo(() => {
    const filters: Record<string, any> = { limit: 10, page: 1 };

    // Si hay filtro por SKU, aplicarlo (tiene prioridad sobre todo)
    if (filterBySku && filterBySku.length > 0) {
      filters.sku = filterBySku.join(",");
      filters.limit = 100; // Aumentar límite para mostrar todos los productos con notificaciones
      return filters; // Retornar solo con filtro de SKU
    }

    // Aplicar filtros guardados desde el inicio (solo si no hay filtro por SKU)
    const savedFilters = getInitialFilters();
    const savedSearch = typeof window !== 'undefined' ? localStorage.getItem('productsSearchQuery') : null;

    if (savedFilters.menu && savedFilters.menu.length > 0) {
      const hasBuds = savedFilters.menu.includes("buds");

      if (hasBuds) {
        const budsValues = savedFilters.menu.filter(v => v === "buds");
        const otherValues = savedFilters.menu.filter(v => v !== "buds");

        if (budsValues.length > 0) {
          filters.name = savedSearch
            ? `${savedSearch}, ${budsValues.join(", ")}`
            : budsValues.join(", ");
        }
        if (otherValues.length > 0) {
          filters.menu = otherValues.join(", ");
        }
      } else {
        filters.menu = savedFilters.menu.join(", ");
      }
    }

    if (savedSearch && !filters.name) {
      filters.name = savedSearch;
    }

    return filters;
  }, [filterBySku]);

  const {
    products: productosCrudos,
    loading,
    error,
    totalItems,
    totalPages,
    currentPage,
    filterProducts,
  } = useProducts(initialFilters);

  /**
   * El filtro de existencias se aplica AQUÍ y no en la petición porque el
   * backend ya no lo soporta: el gateway acepta `stockMinimo`/`stockMaximo` en
   * el DTO, pero products-ms los descarta —hay un comentario explícito en
   * products.service.ts, "no longer supported in DB queries"—, así que mandarlos
   * no filtraba nada y el selector no hacía nada.
   *
   * Recortar en el cliente es correcto en esta pantalla porque la vista de
   * avisos pide los SKU con solicitudes en una sola página (limit 100): están
   * todas las filas a la vista, así que el conteo sigue siendo cierto.
   */
  const products = useMemo(() => {
    if (filtroStock === "todos") return productosCrudos;
    return productosCrudos.filter((p) => {
      const enStock = (p.stockTotal ?? p.stock ?? 0) > 0;
      return filtroStock === "con" ? enStock : !enStock;
    });
  }, [productosCrudos, filtroStock]);

  const handleSortChange = useCallback(
    (field: string, direction:  "desc"| "asc" ) => {
      setSortBy(field);
      setSortOrder(direction);

      const filters: Record<string, any> = {
        limit: pageSize,
        page: 1,
        sortBy: field,
        sortOrder: direction,
      };

      // Siempre mantener el filtro de SKU si existe (para productos con notificaciones)
      if (filterBySku && filterBySku.length > 0) {
        filters.sku = filterBySku.join(",");
      }

      // Aplicar filtros de menú
      if (currentFilters.menu && currentFilters.menu.length > 0) {
        const hasBuds = currentFilters.menu.includes("buds");

        if (hasBuds) {
          const budsValues = currentFilters.menu.filter(v => v === "buds");
          const otherValues = currentFilters.menu.filter(v => v !== "buds");

          if (budsValues.length > 0) {
            filters.name = budsValues.join(", ");
          }

          if (otherValues.length > 0) {
            filters.menu = otherValues.join(", ");
          }
        } else {
          filters.menu = currentFilters.menu.join(", ");
        }
      }

      // Aplicar búsqueda solo si no se sobreescribió con buds
      if (searchQuery && !filters.name) {
        filters.name = searchQuery;
      }

      // Mantener filtro de estado
       if (currentFilters.status && currentFilters.status.length > 0) {
        if (currentFilters.status[0] === "active") {
          filters.minStock = 1;
        } else if (currentFilters.status[0] === "inactive") {
          filters.maxStock = 0;
        }
      }

      filterProducts(filters);
    },
    [filterProducts, currentFilters, searchQuery, pageSize, filterBySku, filtroStock]
  );

  const handlePaginationChange = useCallback(
    (pagination: { pageIndex: number; pageSize: number }) => {
      const newPage = pagination.pageIndex + 1;
      setPageSize(pagination.pageSize);

      const filters: Record<string, any> = {
        limit: pagination.pageSize,
        page: newPage,
      };

      // Siempre mantener el filtro de SKU si existe (para productos con notificaciones)
      if (filterBySku && filterBySku.length > 0) {
        filters.sku = filterBySku.join(",");
      }

      // Aplicar filtros de menú (separados por comas)
      if (currentFilters.menu && currentFilters.menu.length > 0) {
        const hasBuds = currentFilters.menu.includes("buds");

        if (hasBuds) {
          const budsValues = currentFilters.menu.filter(v => v === "buds");
          const otherValues = currentFilters.menu.filter(v => v !== "buds");

          if (budsValues.length > 0) {
            filters.name = budsValues.join(", ");
          }

          if (otherValues.length > 0) {
            filters.menu = otherValues.join(", ");
          }
        } else {
          filters.menu = currentFilters.menu.join(", ");
        }
      }

      // Aplicar búsqueda solo si no se sobreescribió con buds
      if (searchQuery && !filters.name) {
        filters.name = searchQuery;
      }

      // Mantener ordenamiento actual
      if (sortBy) {
        filters.sortBy = sortBy;
        filters.sortOrder = sortOrder;
      }

      // Mantener filtro de estado
       if (currentFilters.status && currentFilters.status.length > 0) {
        if (currentFilters.status[0] === "active") {
          filters.minStock = 1;
        } else if (currentFilters.status[0] === "inactive") {
          filters.maxStock = 0;
        }
      }

      filterProducts(filters);
    },
    [filterProducts, currentFilters, searchQuery, sortBy, sortOrder, filterBySku, filtroStock]
  );

  const handleSearchChange = useCallback(
    (search: string) => {
      setSearchQuery(search);

      // Guardar búsqueda en localStorage (solo si no hay filtro por SKU)
      if (!filterBySku || filterBySku.length === 0) {
        if (search) {
          localStorage.setItem('productsSearchQuery', search);
        } else {
          localStorage.removeItem('productsSearchQuery');
        }
      }

      const filters: Record<string, any> = {
        name: search,
        limit: pageSize,
        page: 1,
      };

      // Siempre mantener el filtro de SKU si existe (para productos con notificaciones)
      if (filterBySku && filterBySku.length > 0) {
        filters.sku = filterBySku.join(",");
      }

      if (currentFilters.menu && currentFilters.menu.length > 0) {
        const hasBuds = currentFilters.menu.includes("buds");

        if (hasBuds) {
          const budsValues = currentFilters.menu.filter(v => v === "buds");
          const otherValues = currentFilters.menu.filter(v => v !== "buds");

          // Combinar búsqueda con buds
          if (budsValues.length > 0) {
            filters.name = search ? `${search}, ${budsValues.join(", ")}` : budsValues.join(", ");
          }

          if (otherValues.length > 0) {
            filters.menu = otherValues.join(", ");
          }
        } else {
          filters.menu = currentFilters.menu.join(", ");
        }
      }

      // Mantener ordenamiento
      if (sortBy) {
        filters.sortBy = sortBy;
        filters.sortOrder = sortOrder;
      }

      // Mantener filtro de estado
       if (currentFilters.status && currentFilters.status.length > 0) {
        if (currentFilters.status[0] === "active") {
          filters.minStock = 1;
        } else if (currentFilters.status[0] === "inactive") {
          filters.maxStock = 0;
        }
      }

      filterProducts(filters);
    },
    [filterProducts, pageSize, currentFilters, sortBy, sortOrder, filterBySku, filtroStock]
  );

  const handleFilterChange = useCallback(
    (filterId: string, value: string[]) => {
      const newFilters = { ...currentFilters, [filterId]: value };
      console.log(newFilters);
      setCurrentFilters(newFilters);

      // Guardar filtro de menú en localStorage (solo si no hay filtro por SKU)
      if (!filterBySku || filterBySku.length === 0) {
        if (filterId === "menu") {
          if (value.length > 0) {
            localStorage.setItem('productsMenuFilter', JSON.stringify(value));
          } else {
            localStorage.removeItem('productsMenuFilter');
          }
        }
      }

      const filters: Record<string, any> = {
        limit: pageSize,
        page: 1,
      };

      // Siempre mantener el filtro de SKU si existe (para productos con notificaciones)
      if (filterBySku && filterBySku.length > 0) {
        filters.sku = filterBySku.join(",");
      }

      // Manejar filtro de Estado
      if (filterId === "status" && value.length > 0) {
        if (value[0] === "active") {
          filters.minStock = 1; // Productos activos: stock >= 1
        } else if (value[0] === "inactive") {
          filters.maxStock = 0; // Productos inactivos: stock = 0
        }
      }

      // Validar si alguno de los valores es "buds"
      if (filterId === "menu" && value.length > 0) {
        const hasBuds = value.includes("buds");

        if (hasBuds) {
          // Si contiene "buds", separar entre buds y otras categorías
          const budsValues = value.filter(v => v === "buds");
          const otherValues = value.filter(v => v !== "buds");

          // Enviar buds como name
          if (budsValues.length > 0) {
            filters.name = searchQuery
              ? `${searchQuery}, ${budsValues.join(", ")}`
              : budsValues.join(", ");
          }

          // Enviar otros menús como menu
          if (otherValues.length > 0) {
            filters[filterId] = otherValues.join(", ");
          }
        } else {
          // Si no hay buds, enviar normalmente como menu
          filters[filterId] = value.join(", ");
        }
      }

      // Mantener la búsqueda existente solo si no se incluyó con buds
      if (searchQuery && !filters.name) {
        filters.name = searchQuery;
      }

      // Mantener ordenamiento
      if (sortBy) {
        filters.sortBy = sortBy;
        filters.sortOrder = sortOrder;
      }

      // Aplicar filtros de estado desde otros filtros guardados
      if (filterId !== "status" && currentFilters.status && currentFilters.status.length > 0) {
        if (currentFilters.status[0] === "active") {
          filters.minStock = 1;
        } else if (currentFilters.status[0] === "inactive") {
          filters.maxStock = 0;
        }
      }

      filterProducts(filters);
    },
    [filterProducts, pageSize, searchQuery, currentFilters, sortBy, sortOrder]
  );

  const tableFilters = useMemo(
    () => [
      {
        id: "menu",
        title: "Menú",
        options: categories,
      },
      // {
      //   id: "status",
      //   title: "Estado",
      //   options: statuses,
      //   singleSelect: true,
      // },
    ],
    [categories]
  );

  const columns = useMemo(
    () => createProductColumns(handleSortChange, notificationsData, notificationsOnly),
    [handleSortChange, notificationsData]
  );

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={products}
      searchKey="name"
      filters={tableFilters} // Permitir filtros (siempre se mantiene el filtro de SKU)
      pageCount={totalPages}
      pageIndex={currentPage - 1}
      pageSize={pageSize}
      // Con el filtro de existencias activo, el total del servidor deja de
      // describir lo que se ve: hay que contar las filas que quedaron.
      totalItems={filtroStock === "todos" ? totalItems : products.length}
      onPaginationChange={handlePaginationChange}
      onSearchChange={handleSearchChange} // Permitir búsqueda (siempre se mantiene el filtro de SKU)
      onFilterChange={handleFilterChange}
      initialFilterValues={currentFilters}
      initialSearchValue={searchQuery}
      loading={loading}
    />
  );
}
