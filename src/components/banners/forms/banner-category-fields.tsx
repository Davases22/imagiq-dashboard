"use client";

import { useEffect, useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryEndpoints } from "@/lib/api";
import { BackendCategory, BackendMenu } from "@/types";
import { Loader2 } from "lucide-react";

interface BannerCategoryFieldsProps {
  categoryId?: string;
  subcategoryId?: string;
  submenuId?: string;
  onCategoryChange: (categoryId: string, categoryName: string) => void;
  onSubcategoryChange: (subcategoryId: string, subcategoryName: string) => void;
  onSubmenuChange: (submenuId: string, submenuName: string) => void;
}

export function BannerCategoryFields({
  categoryId,
  subcategoryId,
  submenuId,
  onCategoryChange,
  onSubcategoryChange,
  onSubmenuChange,
}: Readonly<BannerCategoryFieldsProps>) {
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCategoryUuid, setCurrentCategoryUuid] = useState<string>("");
  const [currentSubcategoryUuid, setCurrentSubcategoryUuid] =
    useState<string>("");
  const [currentSubmenuUuid, setCurrentSubmenuUuid] = useState<string>("");
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryEndpoints.getVisibleCompletas();

        if (response.success && response.data) {
          setCategories(response.data);
        } else {
          setError("Error al cargar categorías");
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Inicializar valores cuando se cargan las categorías (modo edición SOLAMENTE)
  // Este efecto SOLO se ejecuta UNA VEZ cuando las categorías se cargan por primera vez
  useEffect(() => {
    // Solo ejecutar una vez cuando las categorías están listas y hay IDs para inicializar
    if (categories.length === 0 || !categoryId || initializedRef.current) {
      return;
    }

    // Buscar categoría por UUID (create mode) o por nombre (edit mode)
    const category = categories.find((cat) => {
      const catName = cat.nombreVisible || cat.nombre || "";
      return cat.uuid === categoryId || catName === categoryId;
    });

    if (!category) {
      console.error(
        "[BannerCategoryFields] ❌ Categoría no encontrada:",
        categoryId
      );
      return;
    }

    // Establecer UUID de categoría
    setCurrentCategoryUuid(category.uuid);

    // Inicializar subcategoría si existe
    if (subcategoryId && subcategoryId !== "none" && category.menus) {
      const menu = category.menus.find((m) => {
        const menuName = m.nombreVisible || m.nombre || "";
        return m.uuid === subcategoryId || menuName === subcategoryId;
      });

      if (menu) {
        setCurrentSubcategoryUuid(menu.uuid);

        // Inicializar submenú si existe
        if (submenuId && submenuId !== "none" && menu.submenus) {
          const submenu = menu.submenus.find((sm) => {
            const submenuName = sm.nombreVisible || sm.nombre || "";
            return sm.uuid === submenuId || submenuName === submenuId;
          });

          if (submenu) {
            setCurrentSubmenuUuid(submenu.uuid);
          }
        }
      }
    }

    // Marcar como inicializado para evitar re-ejecución
    initializedRef.current = true;
  }, [categories, categoryId, subcategoryId, submenuId]);

  const selectedCategory = categories.find(
    (cat) =>
      cat.uuid === currentCategoryUuid ||
      (cat.nombreVisible || cat.nombre) === categoryId
  );

  const selectedMenu: BackendMenu | undefined = selectedCategory?.menus?.find(
    (menu) =>
      menu.uuid === currentSubcategoryUuid ||
      (menu.nombreVisible || menu.nombre) === subcategoryId
  );

  const handleCategoryChange = (newCategoryId: string) => {
    const category = categories.find((cat) => cat.uuid === newCategoryId);
    const categoryName = category?.nombreVisible || category?.nombre || "";
    setCurrentCategoryUuid(newCategoryId);
    setCurrentSubcategoryUuid("");
    setCurrentSubmenuUuid("");
    onCategoryChange(newCategoryId, categoryName);
    onSubcategoryChange("none", "");
    onSubmenuChange("none", "");
  };

  const handleSubcategoryChange = (value: string) => {
    const menu = selectedCategory?.menus?.find((m) => m.uuid === value);
    const menuName = menu?.nombreVisible || menu?.nombre || "";
    setCurrentSubcategoryUuid(value);
    setCurrentSubmenuUuid("");
    onSubcategoryChange(value, menuName);
    onSubmenuChange("none", "");
  };

  const handleSubmenuChange = (value: string) => {
    const submenu = selectedMenu?.submenus?.find((sm) => sm.uuid === value);
    const submenuName = submenu?.nombreVisible || submenu?.nombre || "";
    setCurrentSubmenuUuid(value);
    onSubmenuChange(value, submenuName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Cargando categorías...
        </span>
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Categoría *</Label>
        <Select
          value={currentCategoryUuid || categoryId}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.uuid} value={category.uuid}>
                {category.nombreVisible || category.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCategory?.menus && selectedCategory.menus.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategoría (Opcional)</Label>
          <Select
            value={currentSubcategoryUuid || subcategoryId}
            onValueChange={handleSubcategoryChange}
          >
            <SelectTrigger id="subcategory">
              <SelectValue placeholder="Selecciona una subcategoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="none" value="none">
                Ninguna (mostrar en toda la categoría)
              </SelectItem>
              {selectedCategory.menus.map((menu) => (
                <SelectItem key={menu.uuid} value={menu.uuid}>
                  {menu.nombreVisible || menu.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedMenu?.submenus && selectedMenu.submenus.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="submenu">Serie / Submenú (Opcional)</Label>
          <Select
            value={currentSubmenuUuid || submenuId}
            onValueChange={handleSubmenuChange}
          >
            <SelectTrigger id="submenu">
              <SelectValue placeholder="Selecciona una serie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="none" value="none">
                Ninguna (mostrar en toda la subcategoría)
              </SelectItem>
              {selectedMenu.submenus.map((submenu) => (
                <SelectItem key={submenu.uuid} value={submenu.uuid}>
                  {submenu.nombreVisible || submenu.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
