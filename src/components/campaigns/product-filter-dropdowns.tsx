"use client";

import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X, Loader2, ChevronDown } from "lucide-react";

export interface ProductFilter {
  categoria?: string;
  subcategoria?: string;
  submenu?: string;
  modelo?: string[];
}

interface ProductFilterDropdownsProps {
  value: ProductFilter;
  onChange: (filter: ProductFilter) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export function ProductFilterDropdowns({
  value,
  onChange,
}: ProductFilterDropdownsProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [submenus, setSubmenus] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const [isLoadingSubmenus, setIsLoadingSubmenus] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const res = await fetch(`${API_URL}/api/users/campaigns/product-categories`, {
          headers: { "X-API-Key": API_KEY },
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Error loading product categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (!value.categoria) {
      setSubcategories([]);
      return;
    }
    const loadSubcategories = async () => {
      setIsLoadingSubcategories(true);
      try {
        const res = await fetch(
          `${API_URL}/api/users/campaigns/product-subcategories?categoria=${encodeURIComponent(value.categoria!)}`,
          { headers: { "X-API-Key": API_KEY } }
        );
        if (res.ok) {
          const data = await res.json();
          setSubcategories(data.subcategories || []);
        }
      } catch (error) {
        console.error("Error loading subcategories:", error);
      } finally {
        setIsLoadingSubcategories(false);
      }
    };
    loadSubcategories();
  }, [value.categoria]);

  // Load submenus when subcategory changes
  useEffect(() => {
    if (!value.categoria || !value.subcategoria) {
      setSubmenus([]);
      return;
    }
    const loadSubmenus = async () => {
      setIsLoadingSubmenus(true);
      try {
        const res = await fetch(
          `${API_URL}/api/users/campaigns/product-submenus?categoria=${encodeURIComponent(value.categoria!)}&subcategoria=${encodeURIComponent(value.subcategoria!)}`,
          { headers: { "X-API-Key": API_KEY } }
        );
        if (res.ok) {
          const data = await res.json();
          setSubmenus(data.submenus || []);
        }
      } catch (error) {
        console.error("Error loading submenus:", error);
      } finally {
        setIsLoadingSubmenus(false);
      }
    };
    loadSubmenus();
  }, [value.categoria, value.subcategoria]);

  // Load models when submenu changes (or subcategory if no submenu)
  useEffect(() => {
    if (!value.categoria || !value.subcategoria) {
      setModels([]);
      return;
    }
    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        let url = `${API_URL}/api/users/campaigns/product-models?categoria=${encodeURIComponent(value.categoria!)}&subcategoria=${encodeURIComponent(value.subcategoria!)}`;
        if (value.submenu) {
          url += `&submenu=${encodeURIComponent(value.submenu)}`;
        }
        const res = await fetch(url, { headers: { "X-API-Key": API_KEY } });
        if (res.ok) {
          const data = await res.json();
          setModels(data.models || []);
        }
      } catch (error) {
        console.error("Error loading models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    loadModels();
  }, [value.categoria, value.subcategoria, value.submenu]);

  const hasFilter = value.categoria || value.subcategoria || value.submenu || (value.modelo && value.modelo.length > 0);

  const handleClearFilter = () => {
    onChange({});
  };

  const activeFilterCount = [value.categoria, value.subcategoria, value.submenu, (value.modelo && value.modelo.length > 0) ? true : undefined].filter(Boolean).length;

  const toggleModelo = (model: string) => {
    const current = value.modelo || [];
    const isSelected = current.includes(model);
    const next = isSelected
      ? current.filter((m) => m !== model)
      : [...current, model];
    onChange({
      categoria: value.categoria,
      subcategoria: value.subcategoria,
      submenu: value.submenu,
      modelo: next.length > 0 ? next : undefined,
    });
  };

  return (
    <div className="space-y-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Segmentar por producto
          </span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs">
              {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""} activo{activeFilterCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilter}
            className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {/* Categoría */}
        <div className="space-y-1 min-w-0">
          <Label className="text-xs text-muted-foreground">Categoría</Label>
          <Select
            value={value.categoria ?? "__all__"}
            onValueChange={(val) => {
              onChange({ categoria: val === "__all__" ? undefined : val });
            }}
          >
            <SelectTrigger className="h-8 text-xs !w-full overflow-hidden [&>span]:truncate">
              {isLoadingCategories ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <SelectValue placeholder="Todas" />
              )}
            </SelectTrigger>
            <SelectContent portal={false}>
              <SelectItem value="__all__" className="text-xs">Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subcategoría */}
        <div className="space-y-1 min-w-0">
          <Label className="text-xs text-muted-foreground">Subcategoría</Label>
          <Select
            value={value.subcategoria ?? "__all__"}
            onValueChange={(val) => {
              onChange({
                categoria: value.categoria,
                subcategoria: val === "__all__" ? undefined : val,
              });
            }}
            disabled={!value.categoria}
          >
            <SelectTrigger className="h-8 text-xs !w-full overflow-hidden [&>span]:truncate">
              {isLoadingSubcategories ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <SelectValue placeholder={value.categoria ? "Todas" : "Selecciona categoría"} />
              )}
            </SelectTrigger>
            <SelectContent portal={false}>
              <SelectItem value="__all__" className="text-xs">Todas</SelectItem>
              {subcategories.map((sub) => (
                <SelectItem key={sub} value={sub} className="text-xs">
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Submenu */}
        <div className="space-y-1 min-w-0">
          <Label className="text-xs text-muted-foreground">Submenu</Label>
          <Select
            value={value.submenu ?? "__all__"}
            onValueChange={(val) => {
              onChange({
                categoria: value.categoria,
                subcategoria: value.subcategoria,
                submenu: val === "__all__" ? undefined : val,
              });
            }}
            disabled={!value.subcategoria}
          >
            <SelectTrigger className="h-8 text-xs !w-full overflow-hidden [&>span]:truncate">
              {isLoadingSubmenus ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <SelectValue placeholder={value.subcategoria ? "Todos" : "Selecciona subcategoría"} />
              )}
            </SelectTrigger>
            <SelectContent portal={false}>
              <SelectItem value="__all__" className="text-xs">Todos</SelectItem>
              {submenus.map((sm) => (
                <SelectItem key={sm} value={sm} className="text-xs">
                  {sm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Modelo (multi-select) */}
        <div className="space-y-1 min-w-0">
          <Label className="text-xs text-muted-foreground">Modelo</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={!value.subcategoria || isLoadingModels}
                className="h-8 w-full justify-between text-xs font-normal px-3"
              >
                {isLoadingModels ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : value.modelo && value.modelo.length > 0 ? (
                  <span className="truncate">
                    {value.modelo.length === 1
                      ? value.modelo[0]
                      : `${value.modelo.length} modelos`}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {value.subcategoria ? "Todos" : "Selecciona subcategoría"}
                  </span>
                )}
                <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0 z-[9999]" align="start" onWheel={(e) => e.stopPropagation()}>
              <div className="max-h-[250px] overflow-y-auto overscroll-contain p-1" onWheel={(e) => e.stopPropagation()}>
                {models.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2 text-center">
                    Sin modelos
                  </p>
                ) : (
                  models.map((model) => {
                    const isChecked = (value.modelo || []).includes(model);
                    return (
                      <label
                        key={model}
                        className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs cursor-pointer hover:bg-accent"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleModelo(model)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="truncate">{model}</span>
                      </label>
                    );
                  })
                )}
              </div>
              {value.modelo && value.modelo.length > 0 && (
                <div className="border-t p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() =>
                      onChange({
                        categoria: value.categoria,
                        subcategoria: value.subcategoria,
                        submenu: value.submenu,
                      })
                    }
                  >
                    Limpiar selección
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
