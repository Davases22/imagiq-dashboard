"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Loader2 } from "lucide-react";
import { bannerEndpoints } from "@/lib/api";
import { BackendBanner } from "@/types/banner";
import { toast } from "sonner";

interface OrganizeBannersModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
}

export function OrganizeBannersModal({
  open,
  onOpenChange,
  onSuccess,
}: OrganizeBannersModalProps) {
  const [placements, setPlacements] = React.useState<string[]>([]);
  const [loadingPlacements, setLoadingPlacements] = React.useState(false);
  const [selectedPlacement, setSelectedPlacement] = React.useState<string>("");
  const [banners, setBanners] = React.useState<BackendBanner[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [draggedBanner, setDraggedBanner] = React.useState<BackendBanner | null>(null);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Cargar placements cuando se abre el modal
  React.useEffect(() => {
    if (open) {
      loadPlacements();
    }
  }, [open]);

  // Cargar banners cuando se selecciona un placement
  React.useEffect(() => {
    if (selectedPlacement) {
      loadBanners(selectedPlacement);
    } else {
      setBanners([]);
    }
  }, [selectedPlacement]);

  const loadPlacements = async () => {
    setLoadingPlacements(true);
    try {
      const response = await bannerEndpoints.getPlacements();
      // La respuesta puede ser un array directo o un objeto con datos
      const placementsData = Array.isArray(response) ? response : (response?.data || []);
      setPlacements(placementsData);
    } catch (error) {
      console.error("Error al cargar placements:", error);
      toast.error("Error al cargar los placements");
      setPlacements([]);
    } finally {
      setLoadingPlacements(false);
    }
  };

  const loadBanners = async (placement: string) => {
    setLoading(true);
    try {
      const response = await bannerEndpoints.getByPlacement(placement);
      // La respuesta puede ser un array directo o un objeto con datos
      const bannersData = Array.isArray(response) ? response : (response?.data || []);
      // Solo mostrar banners activos
      const activeBanners = bannersData.filter((b) => b.status === "active");
      setBanners(activeBanners);
      setHasChanges(false);
    } catch (error) {
      console.error("Error al cargar banners:", error);
      toast.error("Error al cargar los banners");
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, banner: BackendBanner) => {
    setDraggedBanner(banner);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetBanner: BackendBanner) => {
    e.preventDefault();

    if (!draggedBanner || draggedBanner.id === targetBanner.id) {
      setDraggedBanner(null);
      return;
    }

    // Reordenar banners
    const newBanners = [...banners];
    const draggedIndex = newBanners.findIndex((b) => b.id === draggedBanner.id);
    const targetIndex = newBanners.findIndex((b) => b.id === targetBanner.id);

    // Remover el elemento arrastrado
    const [removed] = newBanners.splice(draggedIndex, 1);
    // Insertar en la nueva posición
    newBanners.splice(targetIndex, 0, removed);

    setBanners(newBanners);
    setHasChanges(true);
    setDraggedBanner(null);
  };

  const handleDragEnd = () => {
    setDraggedBanner(null);
  };

  const handleSaveOrder = async () => {
    if (!selectedPlacement || !hasChanges) return;

    setSaving(true);
    try {
      // Crear el payload con el nuevo orden
      const bannerOrders = banners.map((banner, index) => ({
        id: banner.id,
        display_order: index,
      }));

      await bannerEndpoints.updateOrder({
        placement: selectedPlacement,
        bannerOrders,
      });

      toast.success("Orden actualizado exitosamente");
      setHasChanges(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error al actualizar orden:", error);
      toast.error("Error al actualizar el orden de los banners");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      // Recargar banners originales
      loadBanners(selectedPlacement);
    }
    setHasChanges(false);
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirm = window.confirm(
        "Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?"
      );
      if (!confirm) return;
    }
    onOpenChange(false);
    // Reset al cerrar
    setSelectedPlacement("");
    setBanners([]);
    setHasChanges(false);
  };

  const getPlaceholderText = (loading: boolean, placementsList: string[]): string => {
    if (loading) return "Cargando placements...";
    if (placementsList.length === 0) return "No hay placements disponibles";
    return "Selecciona un placement";
  };

  const renderBannersList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Cargando banners...</span>
        </div>
      );
    }

    if (banners.length === 0 && selectedPlacement) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No hay banners activos para este placement
        </div>
      );
    }

    if (banners.length > 0) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-2">
            Arrastra los banners para cambiar su orden
          </p>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              draggable
              role="button"
              tabIndex={0}
              aria-label={`Reordenar banner ${banner.name}`}
              onDragStart={(e) => handleDragStart(e, banner)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, banner)}
              onDragEnd={handleDragEnd}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                }
              }}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-move transition-all ${
                draggedBanner?.id === banner.id
                  ? "opacity-50 scale-95"
                  : "hover:bg-accent"
              }`}
            >
              <div className="flex-shrink-0">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{banner.name}</div>
                {banner.title && (
                  <div className="text-sm text-muted-foreground truncate">
                    {banner.title}
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">#{index + 1}</div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Organizar Banners</DialogTitle>
          <DialogDescription>
            Selecciona un placement y arrastra los banners para reordenarlos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de Placement */}
          <div>
            <label htmlFor="placement-select" className="text-sm font-medium mb-2 block">
              Selecciona el placement
            </label>
            <Select
              value={selectedPlacement}
              onValueChange={setSelectedPlacement}
              disabled={loadingPlacements || placements.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={getPlaceholderText(loadingPlacements, placements)} />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[9999]">
                {placements.map((placement) => (
                  <SelectItem key={placement} value={placement}>
                    {placement}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Banners */}
          {renderBannersList()}

          {/* Botones de acción */}
          {banners.length > 0 && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={!hasChanges || saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveOrder}
                disabled={!hasChanges || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Orden"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
