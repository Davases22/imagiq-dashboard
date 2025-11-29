"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Edit,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Plus,
  Save,
  X,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OfertaDestacada, ofertasDestacadasEndpoints } from "@/lib/api";
import { useOfertasDestacadas } from "@/hooks/useOfertasDestacadas";
import { AddProductDialog } from "@/components/ofertas-destacadas/AddProductDialog";
import { toast } from "sonner";

interface OfertaConProducto extends OfertaDestacada {
  producto_nombre?: string;
  producto_imagen?: string;
  link_url?: string;
}

export default function OfertasDestacadasPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [draggedOferta, setDraggedOferta] = useState<OfertaConProducto | null>(
    null
  );
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [localOfertas, setLocalOfertas] = useState<OfertaConProducto[]>([]);

  const {
    ofertas,
    loading,
    error,
    toggleOfertaActive,
    deleteOferta,
    updateOfertasOrder,
    updateNombre,
    updatingOferta,
    deletingOferta,
    updatingOrder,
    updatingNombre,
    refetch,
  } = useOfertasDestacadas();

  useEffect(() => {
    setLocalOfertas(ofertas);
  }, [ofertas]);

  const handleAddOferta = () => {
    if (ofertas.length >= 12) {
      toast.error("Solo puedes tener máximo 12 ofertas destacadas");
      return;
    }
    setIsAddDialogOpen(true);
  };

  const handleEditOferta = (oferta: OfertaDestacada) => {
    // TODO: Implementar funcionalidad de edición
    console.log("Editar oferta:", oferta);
  };

  const handleDeleteOferta = async (uuid: string) => {
    if (!confirm("¿Estás seguro de eliminar esta oferta destacada?")) return;

    const success = await deleteOferta(uuid);
    if (success) {
      toast.success("Oferta eliminada correctamente");
    } else {
      toast.error("Error al eliminar la oferta");
    }
  };

  const handleDragStart = (e: React.DragEvent, oferta: OfertaDestacada) => {
    setDraggedOferta(oferta);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetOferta: OfertaDestacada) => {
    e.preventDefault();

    if (!draggedOferta || draggedOferta.uuid === targetOferta.uuid) {
      setDraggedOferta(null);
      return;
    }

    const newOfertas = [...localOfertas];
    const draggedIndex = newOfertas.findIndex(
      (o) => o.uuid === draggedOferta.uuid
    );
    const targetIndex = newOfertas.findIndex(
      (o) => o.uuid === targetOferta.uuid
    );

    const [removed] = newOfertas.splice(draggedIndex, 1);
    newOfertas.splice(targetIndex, 0, removed);

    setLocalOfertas(newOfertas);
    setHasOrderChanged(true);
    setDraggedOferta(null);
  };

  const handleDragEnd = () => {
    setDraggedOferta(null);
  };

  const handleSaveOrder = async () => {
    try {
      const uuids = localOfertas.map((o) => o.uuid);
      const success = await updateOfertasOrder(uuids);

      if (success) {
        setHasOrderChanged(false);
        toast.success("Orden actualizado correctamente");
      } else {
        toast.error("Error al guardar el orden");
      }
    } catch (error) {
      console.error("Error al guardar el orden:", error);
      toast.error("Error al guardar el orden");
    }
  };

  const handleCancelOrder = () => {
    setLocalOfertas(ofertas);
    setHasOrderChanged(false);
    setDraggedOferta(null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Ofertas Destacadas
        </h1>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando ofertas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Ofertas Destacadas
        </h1>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ofertas Destacadas
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los productos destacados del dropdown de ofertas (máximo
            12)
          </p>
        </div>
        <div className="flex gap-2">
          {hasOrderChanged && (
            <>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={handleCancelOrder}
                disabled={updatingOrder}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                className="cursor-pointer"
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
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Orden
                  </>
                )}
              </Button>
            </>
          )}
          <Button
            className="cursor-pointer"
            onClick={handleAddOferta}
            disabled={ofertas.length >= 12}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Producto
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Ofertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ofertas.length} / 12</div>
            <p className="text-xs text-muted-foreground">
              {ofertas.filter((o: OfertaConProducto) => o.activo).length}{" "}
              activas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos Configurados</CardTitle>
          <CardDescription>
            Arrastra para reordenar como aparecerán en el dropdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Imagen</TableHead>
                <TableHead>Código Market</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localOfertas.map((oferta) => (
                <TableRow
                  key={oferta.uuid}
                  draggable
                  onDragStart={(e: React.DragEvent<HTMLTableRowElement>) =>
                    handleDragStart(e, oferta)
                  }
                  onDragOver={handleDragOver}
                  onDrop={(e: React.DragEvent<HTMLTableRowElement>) =>
                    handleDrop(e, oferta)
                  }
                  onDragEnd={handleDragEnd}
                  className={`cursor-move transition-all duration-200 ${
                    draggedOferta?.uuid === oferta.uuid
                      ? "opacity-50 scale-95"
                      : ""
                  }`}
                >
                  <TableCell>
                    <Button variant="ghost" size="icon" className="cursor-grab">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {oferta.nombre || oferta.nombre_modelo || oferta.nombre_market || oferta.producto_nombre || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {oferta.producto_imagen ? (
                      <div className="flex items-center gap-2">
                        <div className="relative w-14 h-14 rounded bg-muted overflow-hidden border">
                          <Image
                            src={oferta.producto_imagen}
                            alt={oferta.producto_nombre || "Producto"}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline">Sin imagen</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                            {oferta.codigo_market || "-"}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{oferta.codigo_market || "Sin código"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {oferta.categoria ? (
                      <Badge variant="secondary">
                        {oferta.categoria.nombreVisible || oferta.categoria.nombre}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Sin categoría
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {updatingNombre === oferta.uuid ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Actualizando...</span>
                      </div>
                    ) : (
                      <Select
                        value={
                          // Determinar qué tipo de nombre está seleccionado actualmente
                          // Si no hay nombre, usar modelo por defecto
                          // Comparar el nombre actual con nombre_modelo primero (más específico)
                          !oferta.nombre && oferta.nombre_modelo
                            ? "modelo"
                            : oferta.nombre_modelo && 
                              oferta.nombre === oferta.nombre_modelo
                            ? "modelo"
                            : "market"
                        }
                        onValueChange={(value: "market" | "modelo") => {
                          // Solo actualizar si el valor es diferente al actual
                          const currentType =
                            !oferta.nombre && oferta.nombre_modelo
                              ? "modelo"
                              : oferta.nombre_modelo && 
                                oferta.nombre === oferta.nombre_modelo
                              ? "modelo"
                              : "market";
                          if (value !== currentType) {
                            updateNombre(oferta.uuid, value);
                          }
                        }}
                        disabled={updatingNombre === oferta.uuid || (!oferta.nombre_market && !oferta.nombre_modelo)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Tipo de nombre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem 
                            value="market" 
                            disabled={!oferta.nombre_market}
                          >
                            Nombre de Market
                          </SelectItem>
                          <SelectItem 
                            value="modelo" 
                            disabled={!oferta.nombre_modelo}
                          >
                            Nombre de Modelo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={oferta.activo}
                        onCheckedChange={() => toggleOfertaActive(oferta.uuid)}
                        disabled={updatingOferta === oferta.uuid}
                        className="cursor-pointer"
                      />
                      {updatingOferta === oferta.uuid ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      ) : oferta.activo ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {/* Botón de editar removido */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer text-destructive"
                        onClick={() => handleDeleteOferta(oferta.uuid)}
                        disabled={!!deletingOferta}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddProductDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        ofertasExistentes={ofertas}
        onAdd={async (productoId: string, productoNombre: string, categoriaId?: string) => {
          // Validar máximo 12 productos
          if (ofertas.length >= 12) {
            toast.error("Solo puedes tener hasta 12 productos destacados.");
            return;
          }

          // Validar duplicados
          if (
            ofertas.some((o: OfertaConProducto) => o.codigo_market === productoId)
          ) {
            toast.error("Este producto ya está en el dropdown de ofertas.");
            return;
          }

          // ✅ IMPORTANTE: Validar máximo 3 productos por categoría usando el ID de la BD
          if (categoriaId) {
            // Contar productos que tienen esta categoría asignada
            const productosEnCategoria = ofertas.filter(
              (o: OfertaConProducto) => o.categoria_id === categoriaId
            );

            if (productosEnCategoria.length >= 3) {
              // Obtener nombre de la categoría para el mensaje
              const categoriaNombre = productosEnCategoria[0]?.categoria?.nombreVisible ||
                                      productosEnCategoria[0]?.categoria?.nombre ||
                                      "esta categoría";
              toast.error(`Máximo 3 productos por categoría. "${categoriaNombre}" ya tiene ${productosEnCategoria.length} productos.`);
              return;
            }
          }

          try {
            // El backend calcula el orden automáticamente
            const response = await ofertasDestacadasEndpoints.create({
              codigo_market: productoId,
              nombre: productoNombre,
              activo: true,
              categoria_id: categoriaId, // ✅ Pasar categoría seleccionada
            });
            if (response.success) {
              // Después de crear, establecer nombre_modelo por defecto si está disponible
              const nuevaOferta = response.data as OfertaDestacada;
              if (nuevaOferta?.nombre_modelo && nuevaOferta.uuid) {
                try {
                  // Cambiar a nombre de modelo por defecto
                  await updateNombre(nuevaOferta.uuid, "modelo");
                } catch (error) {
                  // Si falla, no es crítico - la oferta ya se creó
                  console.warn("No se pudo establecer nombre_modelo por defecto:", error);
                }
              }
              toast.success(`${productoNombre} agregado correctamente`);
              await refetch();
              // Cerrar el modal después de agregar exitosamente
              setIsAddDialogOpen(false);
            } else {
              // Mostrar mensaje específico del backend si existe (ej: límite de 3 por categoría)
              const backendMessage =
                (response.data as any)?.message || response.message;
              toast.error(
                backendMessage ||
                  "Error al agregar el producto"
              );
            }
          } catch (error) {
            console.error("Error:", error);
            toast.error("Error al agregar el producto");
          }
        }}
      />
    </div>
  );
}
