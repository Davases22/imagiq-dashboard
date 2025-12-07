"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft } from "lucide-react";
import { DynamicFilter, FilterOrderConfig } from "@/types/filters";
import { WebsiteCategory } from "@/types";
import { useCategories } from "@/features/categories/useCategories";
import { useFilters } from "@/hooks/use-filters";
import { FilterForm } from "@/components/filters/filter-form";
import { toast } from "sonner";

export default function CrearFiltroPage() {
  const router = useRouter();
  const { categories, loading: categoriesLoading } = useCategories();
  const { filters, createFilter, isLoading: filtersLoading } = useFilters();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const handleSave = async (filterData: DynamicFilter) => {
    setIsSaving(true);
    try {
      // Initialize order config for all scopes
      const orderConfig: FilterOrderConfig = {
        categories: {},
        menus: {},
        submenus: {},
      };

      // Set initial order for each scope based on existing filters
      // Find the maximum order for each category to avoid duplicates
      filterData.scope.categories.forEach((categoryId) => {
        const categoryFilters = filters.filter((f) =>
          f.scope.categories.includes(categoryId)
        );
        // Find the maximum order for this category, or use -1 if no filters exist
        const maxOrder = categoryFilters.reduce((max, f) => {
          const order = f.order?.categories[categoryId] ?? -1;
          return Math.max(max, order);
        }, -1);
        // Set order to maxOrder + 1 (will be 0 if no filters exist)
        orderConfig.categories[categoryId] = maxOrder + 1;
      });

      filterData.scope.menus.forEach((menuId) => {
        const menuFilters = filters.filter((f) =>
          f.scope.menus.includes(menuId)
        );
        // Find the maximum order for this menu, or use -1 if no filters exist
        const maxOrder = menuFilters.reduce((max, f) => {
          const order = f.order?.menus[menuId] ?? -1;
          return Math.max(max, order);
        }, -1);
        // Set order to maxOrder + 1 (will be 0 if no filters exist)
        orderConfig.menus[menuId] = maxOrder + 1;
      });

      filterData.scope.submenus.forEach((submenuId) => {
        const submenuFilters = filters.filter((f) =>
          f.scope.submenus.includes(submenuId)
        );
        // Find the maximum order for this submenu, or use -1 if no filters exist
        const maxOrder = submenuFilters.reduce((max, f) => {
          const order = f.order?.submenus[submenuId] ?? -1;
          return Math.max(max, order);
        }, -1);
        // Set order to maxOrder + 1 (will be 0 if no filters exist)
        orderConfig.submenus[submenuId] = maxOrder + 1;
      });

      // Prepare filter data for API
      const filterPayload = {
        sectionName: filterData.sectionName,
        column: filterData.column,
        operator: filterData.operator,
        operatorMode: filterData.operatorMode,
        valueConfig: filterData.valueConfig,
        displayType: filterData.displayType,
        scope: filterData.scope,
        order: orderConfig,
        isActive: filterData.isActive,
      };

      const newFilter = await createFilter(filterPayload);
      
      if (newFilter) {
        router.push("/pagina-web/filtros");
      }
    } catch (error) {
      toast.error("Error al guardar el filtro");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setPendingNavigation(() => () => router.push("/pagina-web/filtros"));
      setShowConfirmDialog(true);
    } else {
      router.push("/pagina-web/filtros");
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      setPendingNavigation(() => () => router.push("/pagina-web/filtros"));
      setShowConfirmDialog(true);
    } else {
      router.push("/pagina-web/filtros");
    }
  };

  const handleConfirmExit = () => {
    setShowConfirmDialog(false);
    setHasChanges(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleCancelExit = () => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
  };

  // Intercept browser navigation (back button, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Crear Nuevo Filtro
          </h1>
          <p className="text-sm text-muted-foreground">
            Configura un nuevo filtro dinámico para productos
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Filtro</CardTitle>
          <CardDescription>
            Completa todos los campos para crear el filtro
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriesLoading || filtersLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Cargando...
            </div>
          ) : (
            <FilterForm
              categories={categories}
              onSave={handleSave}
              onCancel={handleCancel}
              isLoading={isSaving}
              onHasChangesChange={setHasChanges}
            />
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deseas salir sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>
              Has realizado cambios en el formulario. Si sales ahora, perderás todos los cambios no guardados.
              ¿Estás seguro de que deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelExit}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

