"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
import { DynamicFilter } from "@/types/filters";
import { WebsiteCategory } from "@/types";
import { useCategories } from "@/features/categories/useCategories";
import { useFilters } from "@/hooks/use-filters";
import { filterEndpoints } from "@/lib/api";
import { FilterForm } from "@/components/filters/filter-form";
import { toast } from "sonner";

// Type definitions for nested API responses
type NestedFilterResponse = {
  data: DynamicFilter;
};

type FilterResponse = DynamicFilter | NestedFilterResponse;

export default function EditarFiltroPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const filterId = params.id as string;
  const { categories, loading: categoriesLoading } = useCategories();
  const { updateFilter } = useFilters();
  const [editingFilter, setEditingFilter] = useState<DynamicFilter | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  
  // Get the view type from query parameter to know where to return
  const vista = searchParams.get("vista") || "agrupada";

  // Load filter by ID from API
  useEffect(() => {
    const fetchFilter = async () => {
      setLoading(true);
      try {
        const response = await filterEndpoints.getById(filterId);
        
        // Handle nested response structure: { success: true, data: {...} }
        // The API client wraps it, so we get: response.data = { success: true, data: {...} }
        let filterData: DynamicFilter | null = null;
        
        if (response.success && response.data) {
          const responseData = response.data as FilterResponse;
          // Check if response.data is directly the filter object
          if ('id' in responseData || 'sectionName' in responseData) {
            filterData = responseData as DynamicFilter;
          }
          // Check if response.data has a nested data property (backend response structure)
          else if ('data' in responseData && (responseData.data.id || responseData.data.sectionName)) {
            filterData = responseData.data;
          }
        }
        
        if (filterData) {
          // Convert date strings to Date objects
          const filter: DynamicFilter = {
            ...filterData,
            createdAt: filterData.createdAt ? new Date(filterData.createdAt) : new Date(),
            updatedAt: filterData.updatedAt ? new Date(filterData.updatedAt) : new Date(),
          };
          setEditingFilter(filter);
        } else {
          toast.error(response.message || "Filtro no encontrado");
          router.push(`/pagina-web/filtros?vista=${vista}`);
        }
      } catch (error) {
        console.error("Error loading filter:", error);
        toast.error("Error al cargar el filtro");
        router.push(`/pagina-web/filtros?vista=${vista}`);
      } finally {
        setLoading(false);
      }
    };

    if (filterId) {
      fetchFilter();
    }
  }, [filterId, router]);

  const handleSave = async (filterData: DynamicFilter) => {
    setIsSaving(true);
    try {
      // Build update payload matching API expectations
      // Only include operator if operatorMode is "column"
      const updatePayload: {
        sectionName: string;
        column: string;
        operator?: string;
        operatorMode: "column" | "per-value";
        valueConfig: DynamicFilter["valueConfig"];
        displayType: string;
        scope: DynamicFilter["scope"];
        order: DynamicFilter["order"];
        isActive: boolean;
      } = {
        sectionName: filterData.sectionName,
        column: filterData.column,
        operatorMode: filterData.operatorMode,
        valueConfig: filterData.valueConfig,
        displayType: filterData.displayType,
        scope: filterData.scope,
        isActive: filterData.isActive,
        // Preserve order from existing filter
        order: editingFilter?.order || filterData.order,
      };

      // Only include operator if operatorMode is "column"
      if (filterData.operatorMode === "column" && filterData.operator) {
        updatePayload.operator = filterData.operator;
      }

      const updatedFilter = await updateFilter(filterId, updatePayload);
      
      if (updatedFilter) {
        router.push(`/pagina-web/filtros?vista=${vista}`);
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
      setPendingNavigation(() => () => router.push(`/pagina-web/filtros?vista=${vista}`));
      setShowConfirmDialog(true);
    } else {
      router.push(`/pagina-web/filtros?vista=${vista}`);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      setPendingNavigation(() => () => router.push(`/pagina-web/filtros?vista=${vista}`));
      setShowConfirmDialog(true);
    } else {
      router.push(`/pagina-web/filtros?vista=${vista}`);
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

  if (loading || categoriesLoading) {
    return (
      <div className="space-y-6">
        <div className="py-12 text-center text-muted-foreground">
          Cargando...
        </div>
      </div>
    );
  }

  if (!editingFilter) {
    return null;
  }

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
            Editar Filtro
          </h1>
          <p className="text-sm text-muted-foreground">
            Modifica la configuración del filtro
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Filtro</CardTitle>
          <CardDescription>
            Modifica los campos que desees cambiar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilterForm
            filter={editingFilter}
            categories={categories}
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={isSaving}
            onHasChangesChange={setHasChanges}
          />
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

