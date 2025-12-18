"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { GripVertical, Edit, Trash2, Copy, Filter, Plus, ChevronDown, ChevronRight, Search, X, Eye, Save } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterOperator, FilterDisplayType } from "@/types/filters";
import { DynamicFilter, FilterOrderConfig } from "@/types/filters";
import { WebsiteCategory, WebsiteMenu, WebsiteSubmenu } from "@/types";
import { useCategories } from "@/features/categories/useCategories";
import { useProductColumns } from "@/hooks/use-product-columns";
import { useFilters } from "@/hooks/use-filters";
import { useFilterOrder } from "@/hooks/use-filter-order";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GroupedFilters {
  categoryId: string;
  categoryName: string;
  filters: DynamicFilter[];
  menus: Array<{
    menuId: string;
    menuName: string;
    filters: DynamicFilter[];
    submenus: Array<{
      submenuId: string;
      submenuName: string;
      filters: DynamicFilter[];
    }>;
  }>;
}

export default function FiltrosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categories, loading: categoriesLoading } = useCategories();
  const { columns } = useProductColumns();
  const { filters, isLoading: filtersLoading, deleteFilter, deleteBulk, createFilter, refreshFilters, toggleFilterStatus } = useFilters();
  const { updateOrder } = useFilterOrder();
  const [deletingFilter, setDeletingFilter] = useState<DynamicFilter | null>(null);
  const [deletingFilters, setDeletingFilters] = useState<DynamicFilter[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterColumn, setFilterColumn] = useState<string>("all");
  const [filterOperator, setFilterOperator] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [draggedFilter, setDraggedFilter] = useState<{ filter: DynamicFilter; scopeType: 'category' | 'menu' | 'submenu'; scopeId: string } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [updatingStatusFilters, setUpdatingStatusFilters] = useState<Set<string>>(new Set());
  // Estado para rastrear orden reordenado por scope (clave: "scopeType:scopeId", valor: array de filtros reordenados)
  const [reorderedFiltersByScope, setReorderedFiltersByScope] = useState<Map<string, DynamicFilter[]>>(new Map());
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  
  // Get active tab from URL query parameter, default to "agrupada"
  const activeTab = searchParams.get("vista") || "agrupada";
  const [currentTab, setCurrentTab] = useState<"grouped" | "table">(activeTab === "tabla" ? "table" : "grouped");
  
  // Update tab when URL parameter changes
  useEffect(() => {
    const vista = searchParams.get("vista") || "agrupada";
    setCurrentTab(vista === "tabla" ? "table" : "grouped");
  }, [searchParams]);

  // Limpiar estado de reordenamiento cuando se refrescan los filtros desde el servidor
  // Solo si no hay cambios pendientes (para no perder el trabajo del usuario)
  useEffect(() => {
    if (!filtersLoading && !hasOrderChanged && reorderedFiltersByScope.size > 0) {
      setReorderedFiltersByScope(new Map());
    }
  }, [filtersLoading, hasOrderChanged]);

  // Helper para obtener filtros ordenados (usa estado local si hay cambios, sino usa orden original)
  const getOrderedFiltersForScope = (
    scopeType: 'category' | 'menu' | 'submenu',
    scopeId: string,
    originalFilters: DynamicFilter[]
  ): DynamicFilter[] => {
    const scopeKey = `${scopeType}:${scopeId}`;
    const reordered = reorderedFiltersByScope.get(scopeKey);
    
    if (reordered) {
      return reordered;
    }
    
    // Ordenar por orden original
    return [...originalFilters].sort((a, b) => {
      let orderA = -1;
      let orderB = -1;
      
      if (scopeType === 'category') {
        orderA = a.order?.categories[scopeId] ?? -1;
        orderB = b.order?.categories[scopeId] ?? -1;
      } else if (scopeType === 'menu') {
        orderA = a.order?.menus[scopeId] ?? -1;
        orderB = b.order?.menus[scopeId] ?? -1;
      } else {
        orderA = a.order?.submenus[scopeId] ?? -1;
        orderB = b.order?.submenus[scopeId] ?? -1;
      }
      
      if (orderA === -1 && orderB === -1) return 0;
      if (orderA === -1) return 1;
      if (orderB === -1) return -1;
      
      return orderA - orderB;
    });
  };

  // Group filters by category/menu/submenu
  const groupedFilters = useMemo(() => {
    const groups: GroupedFilters[] = [];

    categories.forEach((category) => {
      const categoryFilters = filters.filter(
        (f) => f.scope.categories.includes(category.id)
      );
      const orderedCategoryFilters = getOrderedFiltersForScope('category', category.id, categoryFilters);

      const menuGroups: GroupedFilters["menus"] = [];
      category.menus.forEach((menu) => {
        const menuFilters = filters.filter(
          (f) => f.scope.menus.includes(menu.id)
        );
        const orderedMenuFilters = getOrderedFiltersForScope('menu', menu.id, menuFilters);

        const submenuGroups: Array<{
          submenuId: string;
          submenuName: string;
          filters: DynamicFilter[];
        }> = [];
        menu.submenus.forEach((submenu) => {
          const submenuFilters = filters.filter(
            (f) => f.scope.submenus.includes(submenu.id)
          );
          if (submenuFilters.length > 0) {
            const orderedSubmenuFilters = getOrderedFiltersForScope('submenu', submenu.id, submenuFilters);
            submenuGroups.push({
              submenuId: submenu.id,
              submenuName: submenu.nombreVisible || submenu.name,
              filters: orderedSubmenuFilters,
            });
          }
        });

        if (orderedMenuFilters.length > 0 || submenuGroups.length > 0) {
          menuGroups.push({
            menuId: menu.id,
            menuName: menu.nombreVisible || menu.name,
            filters: orderedMenuFilters,
            submenus: submenuGroups,
          });
        }
      });

      if (orderedCategoryFilters.length > 0 || menuGroups.length > 0) {
        groups.push({
          categoryId: category.id,
          categoryName: category.nombreVisible || category.name,
          filters: orderedCategoryFilters,
          menus: menuGroups,
        });
      }
    });

    return groups;
  }, [filters, categories, reorderedFiltersByScope]);

  const handleCreate = () => {
    router.push("/pagina-web/filtros/crear");
  };

  const handleEdit = (filter: DynamicFilter) => {
    const vista = currentTab === "table" ? "tabla" : "agrupada";
    router.push(`/pagina-web/filtros/${filter.id}/editar?vista=${vista}`);
  };

  const handleView = (filter: DynamicFilter) => {
    const vista = currentTab === "table" ? "tabla" : "agrupada";
    router.push(`/pagina-web/filtros/${filter.id}/ver?vista=${vista}`);
  };

  const handleDelete = (filter: DynamicFilter) => {
    setDeletingFilter(filter);
  };

  const handleDeleteMultiple = () => {
    if (selectedFilters.size === 0) return;
    const filtersToDelete = filters.filter((f) => selectedFilters.has(f.id));
    setDeletingFilters(filtersToDelete);
  };

  const confirmDelete = async () => {
    if (!deletingFilter) return;

    const success = await deleteFilter(deletingFilter.id);
    if (success) {
      setDeletingFilter(null);
      setSelectedFilters(new Set());
    }
  };

  const confirmDeleteMultiple = async () => {
    if (deletingFilters.length === 0) return;

    const filterIds = Array.from(selectedFilters);
    const success = await deleteBulk(filterIds);
    if (success) {
      setDeletingFilters([]);
      setSelectedFilters(new Set());
    }
  };

  const toggleFilterSelection = (filterId: string) => {
    const newSelected = new Set(selectedFilters);
    if (newSelected.has(filterId)) {
      newSelected.delete(filterId);
    } else {
      newSelected.add(filterId);
    }
    setSelectedFilters(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedFilters.size === filters.length) {
      setSelectedFilters(new Set());
    } else {
      setSelectedFilters(new Set(filters.map((f) => f.id)));
    }
  };

  const getColumnLabel = (columnKey: string) => {
    const column = columns.find((c) => c.key === columnKey);
    return column?.label || columnKey;
  };

  // Get unique values for filter dropdowns
  const availableColumns = useMemo(() => {
    const uniqueColumns = Array.from(new Set(filters.map(f => f.column)));
    return uniqueColumns.map(key => ({
      key,
      label: getColumnLabel(key)
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [filters, columns]);

  // Helper to get operator label from columns metadata
  const getOperatorLabel = (operator: FilterOperator): string => {
    for (const column of columns) {
      const opMeta = column.operators?.find(op => op.value === operator);
      if (opMeta) return opMeta.label;
    }
    return operator;
  };

  const availableOperators = useMemo(() => {
    const uniqueOperators = Array.from(new Set(filters.map(f => f.operator).filter(Boolean))) as FilterOperator[];
    return uniqueOperators.sort();
  }, [filters]);

  // Helper to get display type label from API metadata
  // Note: In the table view, we don't have column context, so we show the value directly
  // For better UX, we could fetch display types for each filter's column, but that would be inefficient
  const getDisplayTypeLabel = (type: FilterDisplayType): string => {
    // Return the value directly since labels come from API per column
    return type;
  };

  const availableTypes = useMemo(() => {
    const uniqueTypes = Array.from(new Set(filters.map(f => f.displayType))) as FilterDisplayType[];
    return uniqueTypes.sort();
  }, [filters]);

  // Filter filters based on search query and filter selects
  const filteredFilters = useMemo(() => {
    let result = filters;

    // Filter by name (text search)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((filter) => 
        filter.sectionName.toLowerCase().includes(query)
      );
    }

    // Filter by column
    if (filterColumn && filterColumn !== "all") {
      result = result.filter((filter) => filter.column === filterColumn);
    }

    // Filter by operator
    if (filterOperator && filterOperator !== "all") {
      result = result.filter((filter) => filter.operator === filterOperator);
    }

    // Filter by display type
    if (filterType && filterType !== "all") {
      result = result.filter((filter) => filter.displayType === filterType);
    }

    // Filter by status
    if (filterStatus && filterStatus !== "all") {
      const isActive = filterStatus === "active";
      result = result.filter((filter) => filter.isActive === isActive);
    }

    return result;
  }, [filters, searchQuery, filterColumn, filterOperator, filterType, filterStatus, columns]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterColumn("all");
    setFilterOperator("all");
    setFilterType("all");
    setFilterStatus("all");
  };

  const hasActiveFilters = searchQuery.trim() || (filterColumn && filterColumn !== "all") || (filterOperator && filterOperator !== "all") || (filterType && filterType !== "all") || (filterStatus && filterStatus !== "all");

  const handleDuplicate = async (filter: DynamicFilter) => {
    const duplicated = {
      sectionName: `${filter.sectionName} (Copia)`,
      column: filter.column,
      operator: filter.operator,
      operatorMode: filter.operatorMode,
      valueConfig: filter.valueConfig,
      displayType: filter.displayType,
      scope: filter.scope,
      order: {
        categories: {},
        menus: {},
        submenus: {},
      },
      isActive: filter.isActive,
    };
    
    const newFilter = await createFilter(duplicated);
    if (newFilter) {
      // Filter will be automatically updated via useFilters hook
    }
  };

  const handleToggleStatus = async (filter: DynamicFilter, newStatus: boolean) => {
    // Prevent multiple rapid clicks
    if (updatingStatusFilters.has(filter.id)) {
      return;
    }

    // Add filter to updating set
    setUpdatingStatusFilters((prev) => new Set(prev).add(filter.id));

    try {
      await toggleFilterStatus(filter.id, newStatus);
      // Filter will be automatically updated via useFilters hook
    } finally {
      // Remove filter from updating set after a short delay to prevent rapid toggling
      setTimeout(() => {
        setUpdatingStatusFilters((prev) => {
          const newSet = new Set(prev);
          newSet.delete(filter.id);
          return newSet;
        });
      }, 300);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (
    e: React.DragEvent,
    filter: DynamicFilter,
    scopeType: 'category' | 'menu' | 'submenu',
    scopeId: string
  ) => {
    setDraggedFilter({ filter, scopeType, scopeId });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (
    e: React.DragEvent,
    targetFilter: DynamicFilter,
    scopeType: 'category' | 'menu' | 'submenu',
    scopeId: string
  ) => {
    e.preventDefault();

    if (!draggedFilter || draggedFilter.filter.id === targetFilter.id) {
      setDraggedFilter(null);
      return;
    }

    // Only allow reordering within the same scope
    if (draggedFilter.scopeType !== scopeType || draggedFilter.scopeId !== scopeId) {
      setDraggedFilter(null);
      return;
    }

    const scopeKey = `${scopeType}:${scopeId}`;
    
    // Get current ordered filters for this scope (puede ser del estado local o original)
    let currentOrderedFilters: DynamicFilter[] = [];
    if (reorderedFiltersByScope.has(scopeKey)) {
      currentOrderedFilters = reorderedFiltersByScope.get(scopeKey)!;
    } else {
      // Get filters for this scope
      if (scopeType === 'category') {
        currentOrderedFilters = filters.filter((f) => f.scope.categories.includes(scopeId));
      } else if (scopeType === 'menu') {
        currentOrderedFilters = filters.filter((f) => f.scope.menus.includes(scopeId));
      } else {
        currentOrderedFilters = filters.filter((f) => f.scope.submenus.includes(scopeId));
      }
      
      // Sort by current order
      currentOrderedFilters.sort((a, b) => {
        let orderA = -1;
        let orderB = -1;
        
        if (scopeType === 'category') {
          orderA = a.order?.categories[scopeId] ?? -1;
          orderB = b.order?.categories[scopeId] ?? -1;
        } else if (scopeType === 'menu') {
          orderA = a.order?.menus[scopeId] ?? -1;
          orderB = b.order?.menus[scopeId] ?? -1;
        } else {
          orderA = a.order?.submenus[scopeId] ?? -1;
          orderB = b.order?.submenus[scopeId] ?? -1;
        }
        
        if (orderA === -1 && orderB === -1) return 0;
        if (orderA === -1) return 1;
        if (orderB === -1) return -1;
        
        return orderA - orderB;
      });
    }

    // Validar que hay filtros en el scope
    if (currentOrderedFilters.length === 0) {
      console.error("No filters found in scope:", { scopeType, scopeId });
      setDraggedFilter(null);
      return;
    }

    // Reorder
    const draggedIndex = currentOrderedFilters.findIndex((f) => f.id === draggedFilter.filter.id);
    const targetIndex = currentOrderedFilters.findIndex((f) => f.id === targetFilter.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      console.error("Could not find dragged or target filter in scope filters");
      setDraggedFilter(null);
      return;
    }

    const reordered = [...currentOrderedFilters];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Actualizar estado local con el nuevo orden
    const newReorderedMap = new Map(reorderedFiltersByScope);
    newReorderedMap.set(scopeKey, reordered);
    setReorderedFiltersByScope(newReorderedMap);
    setHasOrderChanged(true);
    setOrderError(null);
    setDraggedFilter(null);
    
    console.log("Order changed - scopeKey:", scopeKey, "hasOrderChanged will be: true");
  };

  const handleDragEnd = () => {
    setDraggedFilter(null);
  };

  // Guardar el nuevo orden
  const handleSaveOrder = async () => {
    setOrderError(null);
    setUpdatingOrder(true);
    
    try {
      // Guardar el orden de cada scope que tiene cambios
      const savePromises: Promise<boolean>[] = [];
      
      reorderedFiltersByScope.forEach((reorderedFilters, scopeKey) => {
        const [scopeType, scopeId] = scopeKey.split(':') as ['category' | 'menu' | 'submenu', string];
        
        // Build filterOrders array for API
        const filterOrders = reorderedFilters.map((f, index) => ({
          filterId: f.id,
          order: index,
        }));

        savePromises.push(
          updateOrder(
            {
              scopeType,
              scopeId,
              filterOrders,
            },
            async () => {
              // Refresh filters after successful order update
              await refreshFilters();
            }
          )
        );
      });

      const results = await Promise.all(savePromises);
      const allSuccess = results.every(r => r === true);

      if (allSuccess) {
        // Limpiar estado local después de guardar exitosamente
        setReorderedFiltersByScope(new Map());
        setHasOrderChanged(false);
        toast.success("Orden de filtros guardado correctamente");
      } else {
        setOrderError("Error al guardar el orden de algunos filtros. Por favor, intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error al guardar el orden:", error);
      setOrderError("Error al guardar el orden. Por favor, intenta nuevamente.");
    } finally {
      setUpdatingOrder(false);
    }
  };

  // Cancelar cambios y restaurar orden original
  const handleCancelOrder = () => {
    setReorderedFiltersByScope(new Map());
    setHasOrderChanged(false);
    setOrderError(null);
    setDraggedFilter(null);
  };

  // Helper function to map scope IDs to names
  const getScopeNames = (filter: DynamicFilter) => {
    const categoryNames: string[] = [];
    const menuNames: string[] = [];
    const submenuNames: string[] = [];

    // Map category IDs to names
    filter.scope.categories.forEach((categoryId) => {
      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        categoryNames.push(category.nombreVisible || category.name);
      }
    });

    // Map menu IDs to names
    filter.scope.menus.forEach((menuId) => {
      categories.forEach((category) => {
        const menu = category.menus.find((m) => m.id === menuId);
        if (menu) {
          menuNames.push(menu.nombreVisible || menu.name);
        }
      });
    });

    // Map submenu IDs to names
    filter.scope.submenus.forEach((submenuId) => {
      categories.forEach((category) => {
        category.menus.forEach((menu) => {
          const submenu = menu.submenus.find((s) => s.id === submenuId);
          if (submenu) {
            submenuNames.push(submenu.nombreVisible || submenu.name);
          }
        });
      });
    });

    return {
      categories: categoryNames,
      menus: menuNames,
      submenus: submenuNames,
    };
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleMenu = (menuId: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const renderFilterItem = (
    filter: DynamicFilter,
    scopeType: 'category' | 'menu' | 'submenu',
    scopeId: string
  ) => {
    const isDragging = draggedFilter?.filter.id === filter.id;
    const isSelected = selectedFilters.has(filter.id);
    const scopeKey = `${scopeType}:${scopeId}`;
    const hasLocalChanges = reorderedFiltersByScope.has(scopeKey);

    return (
      <div
        key={filter.id}
        draggable
        onDragStart={(e) => handleDragStart(e, filter, scopeType, scopeId)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, filter, scopeType, scopeId)}
        onDragEnd={handleDragEnd}
        className={cn(
          "group relative p-3 border rounded-lg cursor-move transition-all mb-2",
          "hover:border-primary hover:bg-primary/5",
          isDragging && "opacity-50 scale-95",
          isSelected && "border-primary bg-primary/10",
          hasLocalChanges && "ring-2 ring-primary/20"
        )}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleFilterSelection(filter.id)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />
          <div className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground group-hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{filter.sectionName}</h4>
                  {filter.isActive ? (
                    <Badge variant="default" className="text-xs">Activo</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>{getColumnLabel(filter.column)}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{filter.operator}</Badge>
                    <Badge variant="secondary" className="text-xs">{filter.displayType}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(filter)}
                  title="Ver"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(filter)}
                  title="Editar"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicate(filter)}
                  title="Duplicar"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(filter)}
                  title="Eliminar"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Configuración de Filtros
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los filtros dinámicos agrupados por categoría, menú y submenú
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedFilters.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleDeleteMultiple}
                disabled={categoriesLoading || filtersLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar {selectedFilters.size} seleccionado(s)
              </Button>
            )}
            <Button onClick={handleCreate} disabled={categoriesLoading || filtersLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Filtro
            </Button>
          </div>
        </div>

        {/* Botones de guardar/cancelar orden */}
        {hasOrderChanged && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
            <div className="flex-1">
              <p className="text-sm font-medium">Cambios en el orden de filtros pendientes</p>
              <p className="text-xs text-muted-foreground">
                Arrastra los filtros para cambiar su orden. Guarda los cambios cuando termines.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCancelOrder}
                disabled={updatingOrder}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSaveOrder}
                disabled={updatingOrder}
              >
                {updatingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Orden
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Error de orden */}
        {orderError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{orderError}</p>
          </div>
        )}
      </div>

      {/* Tabs for different views */}
      <Tabs value={currentTab} onValueChange={(value) => {
        setCurrentTab(value as "grouped" | "table");
        const vista = value === "table" ? "tabla" : "agrupada";
        router.push(`/pagina-web/filtros?vista=${vista}`, { scroll: false });
      }} className="w-full">
        <TabsList>
          <TabsTrigger value="grouped">Vista Agrupada</TabsTrigger>
          <TabsTrigger value="table">Vista de Tabla</TabsTrigger>
        </TabsList>

        {/* Grouped View */}
        <TabsContent value="grouped" className="mt-4">
          {categoriesLoading || filtersLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Cargando filtros...
              </CardContent>
            </Card>
          ) : groupedFilters.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No hay filtros configurados
                </h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                  Crea tu primer filtro dinámico para permitir a los usuarios filtrar
                  productos por diferentes criterios
                </p>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Filtro
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedFilters.map((group) => (
                <Card key={group.categoryId}>
                  <CardHeader>
                    <Collapsible
                      open={expandedCategories.has(group.categoryId)}
                      onOpenChange={() => toggleCategory(group.categoryId)}
                    >
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            {expandedCategories.has(group.categoryId) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <CardTitle className="text-lg">{group.categoryName}</CardTitle>
                            <Badge variant="secondary">
                              {group.filters.length} filtro(s) directo(s)
                            </Badge>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-4 space-y-4">
                          {/* Category-level filters */}
                          {group.filters.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                                Filtros de Categoría
                              </h4>
                              <div className="space-y-2">
                                {group.filters.map((filter) =>
                                  renderFilterItem(filter, 'category', group.categoryId)
                                )}
                              </div>
                            </div>
                          )}

                          {/* Menu-level filters */}
                          {group.menus.map((menu) => (
                            <div key={menu.menuId} className="border-l-2 pl-4">
                              <Collapsible
                                open={expandedMenus.has(menu.menuId)}
                                onOpenChange={() => toggleMenu(menu.menuId)}
                              >
                                <CollapsibleTrigger asChild>
                                  <button className="flex items-center justify-between w-full mb-2">
                                    <div className="flex items-center gap-2">
                                      {expandedMenus.has(menu.menuId) ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                      <h4 className="font-medium">{menu.menuName}</h4>
                                      <Badge variant="outline" className="text-xs">
                                        {menu.filters.length} filtro(s)
                                      </Badge>
                                    </div>
                                  </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="mt-2 space-y-4">
                                    {/* Menu-level filters */}
                                    {menu.filters.length > 0 && (
                                      <div>
                                        <h5 className="text-xs font-medium mb-2 text-muted-foreground">
                                          Filtros de Menú
                                        </h5>
                                        <div className="space-y-2">
                                          {menu.filters.map((filter) =>
                                            renderFilterItem(filter, 'menu', menu.menuId)
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Submenu-level filters */}
                                    {menu.submenus.map((submenu) => (
                                      <div key={submenu.submenuId} className="border-l-2 pl-4">
                                        <h5 className="text-xs font-medium mb-2 text-muted-foreground">
                                          {submenu.submenuName}
                                          <Badge variant="outline" className="text-xs ml-2">
                                            {submenu.filters.length} filtro(s)
                                          </Badge>
                                        </h5>
                                        <div className="space-y-2">
                                          {submenu.filters.map((filter) =>
                                            renderFilterItem(filter, 'submenu', submenu.submenuId)
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table" className="mt-4">
          {categoriesLoading || filtersLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Cargando filtros...
              </CardContent>
            </Card>
          ) : filters.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No hay filtros configurados
                </h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                  Crea tu primer filtro dinámico para permitir a los usuarios filtrar
                  productos por diferentes criterios
                </p>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Filtro
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Filtros</h3>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-8"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Nombre - Text input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    {/* Columna - Select */}
                    <Select value={filterColumn} onValueChange={setFilterColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Columna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las columnas</SelectItem>
                        {availableColumns.map((col) => (
                          <SelectItem key={col.key} value={col.key}>
                            {col.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Operador - Select */}
                    <Select value={filterOperator} onValueChange={setFilterOperator}>
                      <SelectTrigger>
                        <SelectValue placeholder="Operador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los operadores</SelectItem>
                        {availableOperators.map((op) => (
                          <SelectItem key={op} value={op}>
                            {getOperatorLabel(op)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Tipo - Select */}
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {availableTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {getDisplayTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Estado - Select */}
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {hasActiveFilters && (
                    <div className="text-sm text-muted-foreground">
                      Mostrando {filteredFilters.length} de {filters.length} filtro(s)
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredFilters.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>No se encontraron filtros que coincidan con los filtros seleccionados</p>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-2"
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={filteredFilters.length > 0 && filteredFilters.every(f => selectedFilters.has(f.id))}
                            onCheckedChange={() => {
                              if (filteredFilters.every(f => selectedFilters.has(f.id))) {
                                // Deseleccionar todos los filtrados
                                const newSelected = new Set(selectedFilters);
                                filteredFilters.forEach(f => newSelected.delete(f.id));
                                setSelectedFilters(newSelected);
                              } else {
                                // Seleccionar todos los filtrados
                                const newSelected = new Set(selectedFilters);
                                filteredFilters.forEach(f => newSelected.add(f.id));
                                setSelectedFilters(newSelected);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Columna</TableHead>
                        <TableHead>Operador</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Alcance</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFilters.map((filter) => {
                      const isSelected = selectedFilters.has(filter.id);
                      const scopeNames = getScopeNames(filter);
                      const scopeDisplay = [
                        ...scopeNames.categories.map((c) => `Cat: ${c}`),
                        ...scopeNames.menus.map((m) => `Menú: ${m}`),
                        ...scopeNames.submenus.map((s) => `Sub: ${s}`),
                      ].join(", ") || "Ninguno";

                      return (
                        <TableRow key={filter.id} className={isSelected ? "bg-primary/5" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleFilterSelection(filter.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {filter.sectionName}
                          </TableCell>
                          <TableCell>{getColumnLabel(filter.column)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {filter.operator}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {filter.displayType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={filter.isActive}
                                onCheckedChange={(checked) => handleToggleStatus(filter, checked)}
                                disabled={filtersLoading || updatingStatusFilters.has(filter.id)}
                              />
                              <span className="text-xs text-muted-foreground">
                                {filter.isActive ? "Activo" : "Inactivo"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="text-xs text-muted-foreground truncate block" title={scopeDisplay}>
                              {scopeDisplay}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(filter)}
                                title="Ver"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(filter)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicate(filter)}
                                title="Duplicar"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(filter)}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog (Single) */}
      <AlertDialog
        open={deletingFilter !== null}
        onOpenChange={(open) => !open && setDeletingFilter(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar filtro?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el filtro "{deletingFilter?.sectionName}".
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog (Multiple) */}
      <AlertDialog
        open={deletingFilters.length > 0}
        onOpenChange={(open) => !open && setDeletingFilters([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {deletingFilters.length} filtro(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar {deletingFilters.length} filtro(s) seleccionado(s):
              <ul className="list-disc list-inside mt-2 space-y-1">
                {deletingFilters.map((f) => (
                  <li key={f.id} className="text-sm">{f.sectionName}</li>
                ))}
              </ul>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMultiple}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar {deletingFilters.length} filtro(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
