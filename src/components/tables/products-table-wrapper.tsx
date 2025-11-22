"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { DataTable } from "@/components/tables/data-table";
import { createProductColumns } from "@/components/tables/columns/products-columns";
import { useProducts } from "@/features/products/useProducts";
import { categoryEndpoints, GroupedNotificationsResponse } from "@/lib/api";
import { BackendCategoryV2 } from "@/types";

const statuses = [
  { label: "Activo", value: "active" },
  { label: "Inactivo", value: "inactive" },
];

type ViewMode = 'bundles' | 'products'

interface ProductsTableWrapperProps {
  filterBySku?: string[];
  notificationsData?: GroupedNotificationsResponse | null;
  notificationsOnly?: boolean;
  viewMode?: ViewMode;
}

export function ProductsTableWrapper({ filterBySku, notificationsData, notificationsOnly = false, viewMode = 'products' }: ProductsTableWrapperProps = {}) {
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
        // Usar el endpoint V2 que incluye información de bundles
        const response = await categoryEndpoints.getVisibleCompletasV2();
        if (response.success && response.data) {
          const categorias = response.data as BackendCategoryV2[];
          const categoryOptions = categorias.flatMap(category =>
            category.menus
              .filter(menu => menu.nombre) // Filtrar menús vacíos
              .map(menu => ({
                label: menu.nombre,
                value: menu.nombre
              }))
          );
          console.log(categoryOptions)
          setCategories(categoryOptions);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback a V1 si V2 falla
        try {
          const fallbackResponse = await categoryEndpoints.getVisibleCompletas();
          if (fallbackResponse.success && fallbackResponse.data) {
            const categoryOptions = fallbackResponse.data.flatMap(category =>
              category.menus
                .filter(menu => menu.nombre) // Filtrar menús vacíos
                .map(menu => ({
                  label: menu.nombre,
                  value: menu.nombre
                }))
            );
            setCategories(categoryOptions);
          }
        } catch (fallbackError) {
          console.error("Error en fallback:", fallbackError);
        }
      }
    };

    fetchCategories();
  }, []);

  const initialFilters = useMemo(() => {
    // V2: Siempre cargar 10 productos al inicio según el viewMode usando productType
    const filters: Record<string, any> = { 
      limit: 10, 
      page: 1,
      productType: viewMode // V2: Pasar viewMode como productType al backend para filtrar
    };

    // Si hay filtro por SKU, aplicarlo (tiene prioridad sobre todo)
    if (filterBySku && filterBySku.length > 0) {
      filters.sku = filterBySku.join(",");
      filters.limit = 100; // Aumentar límite para mostrar todos los productos con notificaciones
      delete filters.productType; // No aplicar productType si hay filtro por SKU
      return filters; // Retornar solo con filtro de SKU
    }

    // NO aplicar filtros guardados en la carga inicial para evitar problemas
    // Los filtros guardados se aplicarán cuando el usuario interactúe con la UI
    // Esto asegura que siempre se carguen productos al inicio
    
    console.log("[ProductsTableWrapper] Filtros iniciales (viewMode:", viewMode, "productType:", filters.productType, "limit: 10):", filters);
    return filters;
  }, [filterBySku, viewMode]);

  const {
    products,
    loading,
    error,
    totalItems,
    totalPages,
    currentPage,
    filterProducts,
  } = useProducts(initialFilters);

  const handleSortChange = useCallback(
    (field: string, direction:  "desc"| "asc" ) => {
      setSortBy(field);
      setSortOrder(direction);

      const filters: Record<string, any> = {
        limit: pageSize,
        page: 1,
        sortBy: field,
        sortOrder: direction,
        productType: viewMode, // V2: Siempre mantener productType según viewMode
      };

      // Siempre mantener el filtro de SKU si existe (para productos con notificaciones)
      if (filterBySku && filterBySku.length > 0) {
        filters.sku = filterBySku.join(",");
        delete filters.productType; // No aplicar productType si hay filtro por SKU
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
    [filterProducts, currentFilters, searchQuery, pageSize, filterBySku, viewMode]
  );

  const handlePaginationChange = useCallback(
    (pagination: { pageIndex: number; pageSize: number }) => {
      const newPage = pagination.pageIndex + 1;
      setPageSize(pagination.pageSize);

      const filters: Record<string, any> = {
        limit: pagination.pageSize,
        page: newPage,
        productType: viewMode, // V2: Siempre mantener productType según viewMode
      };

      // Siempre mantener el filtro de SKU si existe (para productos con notificaciones)
      if (filterBySku && filterBySku.length > 0) {
        filters.sku = filterBySku.join(",");
        delete filters.productType; // No aplicar productType si hay filtro por SKU
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
        filters.productType = viewMode; // V2: Incluir productType para búsqueda correcta
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
    [filterProducts, pageSize, currentFilters, sortBy, sortOrder, filterBySku, viewMode]
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
        productType: viewMode, // V2: Incluir productType para que el backend sepa si buscar por modelo (bundles) o nombre (productos)
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
    [filterProducts, pageSize, currentFilters, sortBy, sortOrder, filterBySku, viewMode]
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
        productType: viewMode, // V2: Siempre mantener productType según viewMode
      };

      // Siempre mantener el filtro de SKU si existe (para productos con notificaciones)
      if (filterBySku && filterBySku.length > 0) {
        filters.sku = filterBySku.join(",");
        delete filters.productType; // No aplicar productType si hay filtro por SKU
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
        filters.productType = viewMode; // V2: Incluir productType para búsqueda correcta
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
    [filterProducts, pageSize, searchQuery, currentFilters, sortBy, sortOrder, viewMode]
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
    [handleSortChange, notificationsData, notificationsOnly]
  );

  // Filtrar productos según el modo de vista
  // V2: Ya no necesitamos filtrar en frontend porque el backend lo hace con productType
  // Pero mantenemos el filtrado por si acaso el backend no soporta productType
  const filteredProducts = useMemo(() => {
    // Si el backend ya filtró por productType, solo mostrar los productos tal cual
    // Si no, filtrar en frontend como fallback
    if (viewMode === 'bundles') {
      return products.filter(p => p.isBundle === true);
    } else {
      // viewMode === 'products'
      return products.filter(p => p.isBundle !== true);
    }
  }, [products, viewMode]);

  // Recargar productos cuando cambie el viewMode
  // Usar useRef para evitar recargas múltiples
  const previousViewModeRef = useRef(viewMode);
  
  useEffect(() => {
    // Solo recargar si el viewMode realmente cambió
    if (previousViewModeRef.current !== viewMode) {
      previousViewModeRef.current = viewMode;
      
      // Resetear paginación: página 1 y límite 10
      setPageSize(10);
      
      // V2: Usar productType para filtrar en el backend
      const filters: Record<string, any> = { 
        limit: 10, 
        page: 1,
        productType: viewMode // Pasar viewMode como productType
      };

      // Limpiar búsqueda y filtros cuando cambia el viewMode
      setSearchQuery("");
      setCurrentFilters({});
      localStorage.removeItem('productsSearchQuery');
      localStorage.removeItem('productsMenuFilter');

      console.log("[ProductsTableWrapper] Recargando productos por cambio de viewMode:", previousViewModeRef.current, "→", viewMode, "con productType:", filters.productType, "page: 1, limit: 10");
      filterProducts(filters);
    }
  }, [viewMode, filterProducts]);

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <DataTable
      key={`products-table-${viewMode}`} // Forzar re-render cuando cambia viewMode para resetear estado interno
      columns={columns}
      data={filteredProducts}
      searchKey="name"
      filters={tableFilters} // Permitir filtros (siempre se mantiene el filtro de SKU)
      pageCount={totalPages}
      pageIndex={((currentPage ?? 1) - 1) || 0}
      pageSize={pageSize}
      totalItems={totalItems}
      onPaginationChange={handlePaginationChange}
      onSearchChange={handleSearchChange} // Permitir búsqueda (siempre se mantiene el filtro de SKU)
      onFilterChange={handleFilterChange}
      initialFilterValues={currentFilters}
      initialSearchValue={searchQuery}
      loading={loading}
    />
  );
}
