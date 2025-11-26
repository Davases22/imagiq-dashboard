"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Image as ImageIcon,
  Package,
  GripVertical,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { WebsiteCategory } from "@/types";
import { useCategories } from "@/features/categories/useCategories";
import { multimediaEndpoints } from "@/lib/api";
import { toast } from "sonner";

export default function CategoriasPage() {
  const router = useRouter();
  // Mantener estas variables para futuras funcionalidades
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<WebsiteCategory | null>(null);
  const [draggedCategory, setDraggedCategory] =
    useState<WebsiteCategory | null>(null);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [localCategories, setLocalCategories] = useState<WebsiteCategory[]>([]);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Hook para manejar categorías del backend
  const {
    categories: websiteCategories,
    loading,
    error,
    toggleCategoryActive: handleToggleActive,
    updatingCategory,
    updateCategory,
    updatingCategoryData,
    syncCategories,
    syncingCategories,
    updateCategoriesOrder,
    updatingOrder,
    refreshCategories,
  } = useCategories();

  // Sincronizar el estado local con las categorías del hook
  useEffect(() => {
    setLocalCategories(websiteCategories);
  }, [websiteCategories]);

  // Estado del formulario del modal de editar
  const [editCategoryName, setEditCategoryName] = useState<string>("");
  const [editNombreVisible, setEditNombreVisible] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editImage, setEditImage] = useState<string>("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [hasExistingImage, setHasExistingImage] = useState<boolean>(false);
  const [imageToDelete, setImageToDelete] = useState<boolean>(false);

  // Función para manejar la edición de categoría
  const handleEditCategory = async () => {
    if (!selectedCategory || !editCategoryName || !editNombreVisible) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      let imageUrl = editImage;

      // 1. Si se marcó para eliminar la imagen
      if (imageToDelete && hasExistingImage) {
        toast.info("Eliminando imagen...");
        const deleteResponse = await multimediaEndpoints.deleteCategoryImage(
          selectedCategory.id
        );

        if (deleteResponse.success) {
          imageUrl = ""; // Usar cadena vacía en lugar de URL de ejemplo
          toast.success("Imagen eliminada exitosamente");
        } else {
          toast.error(deleteResponse.message || "Error al eliminar la imagen");
          return;
        }
      }
      // 2. Si se seleccionó una nueva imagen
      else if (selectedImageFile) {
        toast.info("Subiendo imagen...");

        // Decidir entre POST (crear) o PUT (actualizar) según si hay imagen existente
        const uploadResponse = hasExistingImage
          ? await multimediaEndpoints.updateCategoryImage(
              selectedCategory.id,
              selectedImageFile
            )
          : await multimediaEndpoints.createCategoryImage(
              selectedCategory.id,
              selectedImageFile
            );

        console.log("Upload response:", uploadResponse);

        if (uploadResponse.success) {
          // Si la respuesta incluye imageUrl, usarla; si no, mantener la imagen actual
          const data = uploadResponse.data as
            | { imageUrl?: string; url?: string }
            | undefined;
          imageUrl = data?.imageUrl || data?.url || editImage;
          toast.success("Imagen subida exitosamente");
        } else {
          toast.error(uploadResponse.message || "Error al subir la imagen");
          return;
        }
      }

      // 2. Luego actualizar los datos de la categoría
      const categoryData = {
        nombre: editCategoryName,
        nombreVisible: editNombreVisible,
        descripcion: editDescription,
        imagen: imageUrl || "", // Usar cadena vacía en lugar de URL de ejemplo
      };

      const success = await updateCategory(selectedCategory.id, categoryData);

      if (success) {
        toast.success("Categoría actualizada correctamente");

        // Refrescar las categorías para obtener la imagen actualizada
        await refreshCategories();

        setEditCategoryName("");
        setEditNombreVisible("");
        setEditDescription("");
        setEditImage("");
        setSelectedImageFile(null);
        setImagePreviewUrl("");
        setHasExistingImage(false);
        setSelectedCategory(null);
        setIsEditDialogOpen(false);
      } else {
        toast.error("Error al actualizar la categoría");
      }
    } catch (error) {
      console.error("Error al actualizar categoría:", error);
      toast.error("Error inesperado al actualizar la categoría");
    }
  };

  // Función para resetear el formulario de edición al cerrar el modal
  const handleCloseEditModal = () => {
    setEditCategoryName("");
    setEditNombreVisible("");
    setEditDescription("");
    setEditImage("");
    setSelectedImageFile(null);
    setImagePreviewUrl("");
    setHasExistingImage(false);
    setImageToDelete(false);
    setSelectedCategory(null);
    setIsEditDialogOpen(false);
  };

  // Función para manejar el cambio de estado del modal de edición
  const handleEditModalOpenChange = (open: boolean) => {
    if (!open) {
      handleCloseEditModal();
    }
  };

  // Función para abrir el modal de edición con los datos de la categoría
  const handleOpenEditModal = (category: WebsiteCategory) => {
    setSelectedCategory(category);
    setEditCategoryName(category.name);
    setEditNombreVisible(category.nombreVisible || "");
    setEditDescription(category.description || "");
    setEditImage(category.image || "");
    setSelectedImageFile(null);
    setImageToDelete(false);

    // Verificar si tiene imagen existente y configurar preview
    const hasImage = !!(
      category.image && category.image !== "https://example.com/mock-image.jpg"
    );
    setHasExistingImage(hasImage);
    setImagePreviewUrl(hasImage && category.image ? category.image : "");

    setIsEditDialogOpen(true);
  };

  // Función para eliminar la imagen actual
  const handleRemoveImage = () => {
    setImageToDelete(true);
    setImagePreviewUrl("");
    setSelectedImageFile(null);
    toast.info("Imagen marcada para eliminar");
  };

  // Función para manejar la selección de archivo de imagen
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor selecciona un archivo de imagen válido");
        return;
      }

      // Validar tamaño máximo (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("La imagen no debe superar los 5MB");
        return;
      }

      setSelectedImageFile(file);
      setImageToDelete(false); // Cancelar eliminación si se selecciona nueva imagen

      // Crear URL de preview para la nueva imagen seleccionada
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      toast.success(`Imagen "${file.name}" seleccionada`);
    }
  };

  // Funciones para drag and drop
  const handleDragStart = (e: React.DragEvent, category: WebsiteCategory) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetCategory: WebsiteCategory) => {
    e.preventDefault();

    if (!draggedCategory || draggedCategory.id === targetCategory.id) {
      setDraggedCategory(null);
      return;
    }

    // Reordenar las categorías localmente
    const newCategories = [...localCategories];
    const draggedIndex = newCategories.findIndex(
      (cat) => cat.id === draggedCategory.id
    );
    const targetIndex = newCategories.findIndex(
      (cat) => cat.id === targetCategory.id
    );

    // Remover el elemento arrastrado
    const [removed] = newCategories.splice(draggedIndex, 1);
    // Insertar en la nueva posición
    newCategories.splice(targetIndex, 0, removed);

    // Actualizar el estado local
    setLocalCategories(newCategories);
    setHasOrderChanged(true);
    setDraggedCategory(null);
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
  };

  // Función para guardar el nuevo orden
  const handleSaveOrder = async () => {
    setOrderError(null);
    try {
      const categoryIds = localCategories.map((cat) => cat.id);
      const success = await updateCategoriesOrder(categoryIds);

      if (success) {
        setHasOrderChanged(false);
        // Orden guardado exitosamente
      } else {
        setOrderError(
          "Error al guardar el orden. Por favor, intenta nuevamente."
        );
      }
    } catch (error) {
      console.error("Error al guardar el orden:", error);
      setOrderError(
        "Error al guardar el orden. Por favor, intenta nuevamente."
      );
    }
  };

  const handleCancelOrder = () => {
    // Restaurar el orden original
    setLocalCategories(websiteCategories);
    setHasOrderChanged(false);
    setDraggedCategory(null);
    setOrderError(null);
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Categorías del Sitio Web
          </h1>
          <p className="text-sm text-muted-foreground">
            Cargando categorías...
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando categorías...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si hay alguno
  if (error) {
    return (
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Categorías del Sitio Web
          </h1>
          <p className="text-sm text-muted-foreground">
            Error al cargar categorías
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">
              {error ?? "Ha ocurrido un error"}
            </p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Categorías del Sitio Web
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las categorías y menús visibles en tu tienda
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
            onClick={syncCategories}
            disabled={syncingCategories}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                syncingCategories ? "animate-spin" : ""
              }`}
            />
            {syncingCategories ? "Sincronizando..." : "Sincronizar"}
          </Button>
          <Button
            className="cursor-pointer"
            variant="secondary"
            onClick={() => {
              window.location.href = "/pagina-web/ofertas-destacadas";
            }}
          >
            Ofertas
          </Button>
        </div>

        {/* Error de Orden */}
        {orderError && (
          <Alert variant="destructive">
            <AlertDescription>{orderError}</AlertDescription>
          </Alert>
        )}

        {/* Modal de Edición */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={handleEditModalOpenChange}
        >
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col [&>button]:cursor-pointer">
            <DialogHeader>
              <DialogTitle>Editar Categoría</DialogTitle>
              <DialogDescription>
                Modifica los datos de la categoría seleccionada
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="edit-category-name">
                  Categoría de Productos
                </Label>
                <Input
                  id="edit-category-name"
                  value={editCategoryName}
                  disabled={true}
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El nombre de la categoría no es editable
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-nombre-visible">Nombre Visible</Label>
                <Input
                  id="edit-nombre-visible"
                  placeholder="Nombre que se mostrará en el sitio web"
                  value={editNombreVisible}
                  onChange={(e) => setEditNombreVisible(e.target.value)}
                  disabled={updatingCategoryData}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Nombre personalizado para mostrar en el sitio web
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción (opcional)</Label>
                <Input
                  id="edit-description"
                  placeholder="Descripción de la categoría para SEO"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={updatingCategoryData}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-image">Imagen de la Categoría</Label>

                {/* Preview de la imagen */}
                {imagePreviewUrl && !imageToDelete && (
                  <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge
                        variant={
                          hasExistingImage && !selectedImageFile
                            ? "secondary"
                            : "default"
                        }
                      >
                        {hasExistingImage && !selectedImageFile
                          ? "Imagen actual"
                          : "Nueva imagen"}
                      </Badge>
                      {hasExistingImage && !selectedImageFile && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                          disabled={updatingCategoryData}
                          className="cursor-pointer"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Mensaje si se marcó para eliminar */}
                {imageToDelete && (
                  <div className="p-4 border rounded-lg bg-destructive/10 border-destructive/30">
                    <p className="text-sm text-destructive font-medium">
                      La imagen se eliminará al presionar "Actualizar Categoría"
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    disabled={updatingCategoryData}
                    onChange={handleImageFileChange}
                  />
                  {selectedImageFile && (
                    <Badge variant="secondary" className="gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {selectedImageFile.name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tamaño recomendado: 600x400px
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseEditModal}
                disabled={updatingCategoryData}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditCategory}
                disabled={
                  updatingCategoryData ||
                  !editCategoryName ||
                  !editNombreVisible
                }
                className="cursor-pointer"
              >
                {updatingCategoryData ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Categoría"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{websiteCategories.length}</div>
            <p className="text-xs text-muted-foreground">
              {websiteCategories.filter((c) => c.isActive).length} activas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Subcategorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {websiteCategories.reduce(
                (acc, cat) => acc + cat.menus.length,
                0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              En todas las categorías
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Productos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {websiteCategories.reduce(
                (acc, cat) => acc + (cat.productsCount || 0),
                0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Distribuidos en categorías
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Con Imagen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {websiteCategories.filter((c) => c.image).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Categorías con imagen asignada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categorías Configuradas</CardTitle>
          <CardDescription>
            Arrastra para reordenar las categorías como aparecerán en tu sitio
            web
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Nombre visible</TableHead>
                <TableHead>Menús</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Imagen</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localCategories.map((category) => (
                <TableRow
                  key={category.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, category)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, category)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-move transition-all duration-200 ${
                    draggedCategory?.id === category.id
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
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {category.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span>{category.nombreVisible || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer hover:bg-primary/10 hover:border-primary/20 transition-colors"
                            onClick={() => {
                              router.push(
                                `/pagina-web/categorias/${category.id}/menus`
                              );
                            }}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            {category.menus.length}{" "}
                            {category.menus.length === 1 ? "menú" : "menús"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Configurar menús de {category.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span>{category.productsCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {category.image &&
                    category.image !== "https://example.com/mock-image.jpg" ? (
                      <Badge variant="secondary" className="gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Asignada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        Sin imagen
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={category.isActive}
                        onCheckedChange={() => handleToggleActive(category.id)}
                        disabled={updatingCategory === category.id}
                        className="cursor-pointer"
                      />
                      {(() => {
                        if (updatingCategory === category.id) {
                          return (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          );
                        }
                        return category.isActive ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer"
                      onClick={() => handleOpenEditModal(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
