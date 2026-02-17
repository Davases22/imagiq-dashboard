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
import { Filter, X, Loader2 } from "lucide-react";

export interface ProductFilter {
  categoria?: string;
  subcategoria?: string;
  modelo?: string;
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
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
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

  // Load models when subcategory changes
  useEffect(() => {
    if (!value.categoria || !value.subcategoria) {
      setModels([]);
      return;
    }
    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        const res = await fetch(
          `${API_URL}/api/users/campaigns/product-models?categoria=${encodeURIComponent(value.categoria!)}&subcategoria=${encodeURIComponent(value.subcategoria!)}`,
          { headers: { "X-API-Key": API_KEY } }
        );
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
  }, [value.categoria, value.subcategoria]);

  const hasFilter = value.categoria || value.subcategoria || value.modelo;

  const handleClearFilter = () => {
    onChange({});
  };

  const activeFilterCount = [value.categoria, value.subcategoria, value.modelo].filter(Boolean).length;

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
      <div className="grid grid-cols-3 gap-2">
        {/* Categoría */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Categoría</Label>
          <Select
            value={value.categoria ?? "__all__"}
            onValueChange={(val) => {
              onChange({ categoria: val === "__all__" ? undefined : val });
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              {isLoadingCategories ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <SelectValue placeholder="Todas las categorías" />
              )}
            </SelectTrigger>
            <SelectContent portal={false}>
              <SelectItem value="__all__" className="text-xs">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subcategoría */}
        <div className="space-y-1">
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
            <SelectTrigger className="h-8 text-xs">
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

        {/* Modelo */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Modelo</Label>
          <Select
            value={value.modelo ?? "__all__"}
            onValueChange={(val) => {
              onChange({
                categoria: value.categoria,
                subcategoria: value.subcategoria,
                modelo: val === "__all__" ? undefined : val,
              });
            }}
            disabled={!value.subcategoria}
          >
            <SelectTrigger className="h-8 text-xs">
              {isLoadingModels ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <SelectValue placeholder={value.subcategoria ? "Todos" : "Selecciona subcategoría"} />
              )}
            </SelectTrigger>
            <SelectContent portal={false}>
              <SelectItem value="__all__" className="text-xs">Todos</SelectItem>
              {models.map((model) => (
                <SelectItem key={model} value={model} className="text-xs">
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
