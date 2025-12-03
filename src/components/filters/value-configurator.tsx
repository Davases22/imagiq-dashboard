"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, X, Info, Edit, Check } from "lucide-react";
import {
  FilterValueConfig,
  FilterOperator,
  FilterScope,
  ProductColumn,
  DynamicValueConfig,
  ManualValueConfig,
  MixedValueConfig,
  ValueItem,
  RangeItem,
} from "@/types/filters";
import { WebsiteCategory } from "@/types";
import { productEndpoints } from "@/lib/api";

interface ValueConfiguratorProps {
  value: FilterValueConfig;
  onValueChange: (config: FilterValueConfig) => void;
  operator: FilterOperator;
  operatorMode: "column" | "per-value";
  onOperatorModeChange: (mode: "column" | "per-value") => void;
  column: ProductColumn | undefined;
  scope?: FilterScope;
  categories?: WebsiteCategory[];
  disabled?: boolean;
}

// Helper function to convert column key to camelCase for API
const toCamelCase = (str: string): string => {
  if (str === "nombrecolor") {
    return "nombreColor";
  }
  if (str === "nombreMarket" || str === "codigoMarket") {
    return str;
  }
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Helper function to map scope IDs to API parameter names
const mapScopeToApiParams = (
  scope: FilterScope | undefined,
  categories: WebsiteCategory[]
): { categoria?: string; menu?: string; submenu?: string } => {
  if (!scope) {
    return {};
  }

  const params: { categoria?: string; menu?: string; submenu?: string } = {};

  // Map category IDs to codes
  if (scope.categories.length > 0) {
    const categoryCodes = scope.categories
      .map((categoryId) => {
        const category = categories.find((c) => c.id === categoryId);
        return category?.name;
      })
      .filter((code): code is string => !!code);
    
    if (categoryCodes.length > 0) {
      params.categoria = categoryCodes.join(",");
    }
  }

  // Map menu IDs to names (use name, not nombreVisible, as backend expects name)
  if (scope.menus.length > 0) {
    const menuNames = scope.menus
      .map((menuId) => {
        for (const category of categories) {
          const menu = category.menus.find((m) => m.id === menuId);
          if (menu) {
            return menu.name;
          }
        }
        return null;
      })
      .filter((name): name is string => !!name);
    
    if (menuNames.length > 0) {
      params.menu = menuNames.join(",");
    }
  }

  // Map submenu IDs to names (use name, not nombreVisible, as backend expects name)
  if (scope.submenus.length > 0) {
    const submenuNames = scope.submenus
      .map((submenuId) => {
        for (const category of categories) {
          for (const menu of category.menus) {
            const submenu = menu.submenus.find((s) => s.id === submenuId);
            if (submenu) {
              return submenu.name;
            }
          }
        }
        return null;
      })
      .filter((name): name is string => !!name);
    
    if (submenuNames.length > 0) {
      params.submenu = submenuNames.join(",");
    }
  }

  return params;
};

export function ValueConfigurator({
  value,
  onValueChange,
  operator,
  operatorMode,
  onOperatorModeChange,
  column,
  scope,
  categories = [],
  disabled = false,
}: ValueConfiguratorProps) {
  const [dynamicValues, setDynamicValues] = useState<string[]>([]);
  const [loadingDynamic, setLoadingDynamic] = useState(false);
  const [newManualValue, setNewManualValue] = useState("");
  const [newManualLabel, setNewManualLabel] = useState("");
  const [newManualOperator, setNewManualOperator] = useState<FilterOperator>("equal");
  const [newManualMin, setNewManualMin] = useState("");
  const [newManualMax, setNewManualMax] = useState("");
  const [newRangeLabel, setNewRangeLabel] = useState("");
  const [newRangeMin, setNewRangeMin] = useState("");
  const [newRangeMax, setNewRangeMax] = useState("");
  const [editingValue, setEditingValue] = useState<{ index: number; isMixed: boolean } | null>(null);
  const [editingValueData, setEditingValueData] = useState<{
    value: string;
    label: string;
    operator: FilterOperator;
    min: string;
    max: string;
  } | null>(null);
  
  // Use ref to track the last request to avoid duplicate calls
  const lastRequestRef = useRef<string>("");

  const supportsDynamic = column?.supportsDynamic ?? false;
  const isRangeOperator = operator === "range";
  const availableOperators = column?.operators || [];

  // Memoize scope keys
  const scopeCategoriesKey = useMemo(() => scope?.categories.join(",") || "", [scope?.categories]);
  const scopeMenusKey = useMemo(() => scope?.menus.join(",") || "", [scope?.menus]);
  const scopeSubmenusKey = useMemo(() => scope?.submenus.join(",") || "", [scope?.submenus]);

  // Function to fetch dynamic values from API
  const fetchDynamicValues = () => {
    if (!column || loadingDynamic) return;

    const apiColumnKey = toCamelCase(column.key);
    const scopeKey = scope 
      ? `${scopeCategoriesKey}|${scopeMenusKey}|${scopeSubmenusKey}`
      : "";
    const requestKey = `${apiColumnKey}|${scopeKey}`;
    
    if (lastRequestRef.current === requestKey && dynamicValues.length > 0) {
      return;
    }
    
      setLoadingDynamic(true);
    lastRequestRef.current = requestKey;
    
    const apiParams = mapScopeToApiParams(scope, categories);
    
    productEndpoints
      .getDistinctValues(apiColumnKey, apiParams)
      .then((response) => {
        if (response.success) {
          let valuesArray: string[] = [];
          
          // Type definitions for nested value responses
          type NestedValuesResponse = {
            values: string[];
          };
          
          type DoubleNestedValuesResponse = {
            data: {
              values: string[];
            };
          };
          
          type ValuesResponse = string[] | NestedValuesResponse | DoubleNestedValuesResponse;
          
          if (Array.isArray(response.data)) {
            valuesArray = response.data;
          } else if (response.data && typeof response.data === 'object') {
            const data = response.data as ValuesResponse;
            if ('values' in data && Array.isArray(data.values)) {
              valuesArray = data.values;
            } else if ('data' in data) {
              const nestedData = data as DoubleNestedValuesResponse;
              if (nestedData.data && 'values' in nestedData.data && Array.isArray(nestedData.data.values)) {
                valuesArray = nestedData.data.values;
              }
            }
          }
          
          if (valuesArray.length > 0) {
            setDynamicValues(valuesArray);
            // Reset selected values if they're no longer in the new list
            if (value.type === "dynamic") {
              const dynamicConfig = value as DynamicValueConfig;
              if (dynamicConfig.selectedValues.length > 0) {
                const validSelectedValues = dynamicConfig.selectedValues.filter((val) =>
                  valuesArray.includes(val.value)
                );
                if (validSelectedValues.length !== dynamicConfig.selectedValues.length) {
                  onValueChange({ ...value, selectedValues: validSelectedValues } as DynamicValueConfig);
                }
              }
            } else if (value.type === "mixed") {
              const mixedConfig = value as MixedValueConfig;
              if (mixedConfig.dynamicValues.length > 0) {
                const validDynamicValues = mixedConfig.dynamicValues.filter((val) =>
                  valuesArray.includes(val.value)
                );
                if (validDynamicValues.length !== mixedConfig.dynamicValues.length) {
                  onValueChange({ ...value, dynamicValues: validDynamicValues } as MixedValueConfig);
                }
              }
            }
          } else {
            setDynamicValues([]);
          }
        } else {
          setDynamicValues([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching distinct values:", error);
        setDynamicValues([]);
        lastRequestRef.current = "";
      })
      .finally(() => {
        setLoadingDynamic(false);
      });
  };

  // Auto-load dynamic values when editing a filter with selected values
  useEffect(() => {
    // Only auto-load if:
    // 1. Column is available
    // 2. Supports dynamic values
    // 3. Value config has selected values (dynamic or mixed)
    // 4. Dynamic values haven't been loaded yet
    if (column && supportsDynamic && !loadingDynamic) {
      const hasSelectedValues = 
        (value.type === "dynamic" && (value as DynamicValueConfig).selectedValues.length > 0) ||
        (value.type === "mixed" && (value as MixedValueConfig).dynamicValues.length > 0);
      
      // Check if we need to load values (either no values loaded or scope changed)
      const apiColumnKey = toCamelCase(column.key);
      const scopeKey = scope 
        ? `${scopeCategoriesKey}|${scopeMenusKey}|${scopeSubmenusKey}`
        : "";
      const requestKey = `${apiColumnKey}|${scopeKey}`;
      const needsLoad = lastRequestRef.current !== requestKey || dynamicValues.length === 0;
      
      if (hasSelectedValues && needsLoad) {
        fetchDynamicValues();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column?.key, supportsDynamic, value.type, value, scopeCategoriesKey, scopeMenusKey, scopeSubmenusKey]);

  // Helper to get default operator for a value
  const getDefaultOperatorForValue = (): FilterOperator => {
    if (operatorMode === "column") {
      return operator;
    }
    return "equal";
  };

  // Toggle dynamic value selection
  const toggleDynamicValue = (val: string) => {
    const defaultOp = getDefaultOperatorForValue();
    
    if (value.type === "dynamic") {
      const dynamicConfig = value as DynamicValueConfig;
      const existingIndex = dynamicConfig.selectedValues.findIndex(v => v.value === val);
      
      if (existingIndex >= 0) {
        const newSelected = dynamicConfig.selectedValues.filter((v) => v.value !== val);
        onValueChange({ ...dynamicConfig, selectedValues: newSelected });
    } else {
        const newValue: ValueItem = {
          value: val,
          operator: operatorMode === "per-value" ? defaultOp : undefined,
        };
        onValueChange({ ...dynamicConfig, selectedValues: [...dynamicConfig.selectedValues, newValue] });
      }
    } else if (value.type === "mixed") {
      const mixedConfig = value as MixedValueConfig;
      const existingIndex = mixedConfig.dynamicValues.findIndex(v => v.value === val);
      
      if (existingIndex >= 0) {
        const newDynamicValues = mixedConfig.dynamicValues.filter((v) => v.value !== val);
        onValueChange({ ...mixedConfig, dynamicValues: newDynamicValues });
    } else {
        const newValue: ValueItem = {
          value: val,
          operator: operatorMode === "per-value" ? defaultOp : undefined,
        };
        onValueChange({ ...mixedConfig, dynamicValues: [...mixedConfig.dynamicValues, newValue] });
      }
    }
  };

  const toggleSelectAllDynamicValues = () => {
    const defaultOp = getDefaultOperatorForValue();
    
    if (value.type === "dynamic") {
      const dynamicConfig = value as DynamicValueConfig;
      const selectedValues = dynamicConfig.selectedValues.map(v => v.value);
      const allSelected = dynamicValues.length > 0 && 
        dynamicValues.every(val => selectedValues.includes(val));

      if (allSelected) {
        onValueChange({ ...dynamicConfig, selectedValues: [] });
      } else {
        const newValues: ValueItem[] = dynamicValues.map(val => ({
          value: val,
          operator: operatorMode === "per-value" ? defaultOp : undefined,
        }));
        onValueChange({ ...dynamicConfig, selectedValues: newValues });
      }
    } else if (value.type === "mixed") {
      const mixedConfig = value as MixedValueConfig;
      const selectedValues = mixedConfig.dynamicValues.map(v => v.value);
      const allSelected = dynamicValues.length > 0 && 
        dynamicValues.every(val => selectedValues.includes(val));

      if (allSelected) {
        onValueChange({ ...mixedConfig, dynamicValues: [] });
      } else {
        const newValues: ValueItem[] = dynamicValues.map(val => ({
          value: val,
          operator: operatorMode === "per-value" ? defaultOp : undefined,
        }));
        onValueChange({ ...mixedConfig, dynamicValues: newValues });
      }
    }
  };

  // Add manual value
  const addManualValue = () => {
    const selectedOp = operatorMode === "per-value" ? newManualOperator : getDefaultOperatorForValue();
    const isRangeOp = selectedOp === "range";
    
    // Validación para rangos
    if (isRangeOp) {
      if (!newManualMin || !newManualMax || !newManualLabel.trim()) return;
      const min = parseFloat(newManualMin);
      const max = parseFloat(newManualMax);
      if (isNaN(min) || isNaN(max) || min >= max) return;
    } else {
      if (!newManualValue.trim()) return;
    }

    const newValue: ValueItem = {
      value: isRangeOp ? newManualMin : newManualValue.trim(),
      label: newManualLabel.trim() || undefined,
      operator: operatorMode === "per-value" ? selectedOp : undefined,
      min: isRangeOp ? parseFloat(newManualMin) : undefined,
      max: isRangeOp ? parseFloat(newManualMax) : undefined,
    };

    if (value.type === "manual") {
      const manualConfig = value as ManualValueConfig;
      onValueChange({
        ...manualConfig,
        values: [...(manualConfig.values || []), newValue],
      });
    } else if (value.type === "mixed") {
      const mixedConfig = value as MixedValueConfig;
      onValueChange({
        ...mixedConfig,
        manualValues: [...mixedConfig.manualValues, newValue],
      });
    }
    setNewManualValue("");
    setNewManualLabel("");
    setNewManualMin("");
    setNewManualMax("");
    setNewManualOperator("equal"); // Reset to default
  };

  // Remove manual value
  const removeManualValue = (index: number, isMixed: boolean = false) => {
    if (value.type === "manual") {
      const manualConfig = value as ManualValueConfig;
      const newValues = (manualConfig.values || []).filter((_, i) => i !== index);
      onValueChange({ ...manualConfig, values: newValues });
    } else if (value.type === "mixed") {
      const mixedConfig = value as MixedValueConfig;
      if (isMixed) {
        const newManualValues = mixedConfig.manualValues.filter((_, i) => i !== index);
        onValueChange({ ...mixedConfig, manualValues: newManualValues });
      }
    }
  };

  // Start editing a manual value
  const startEditingValue = (index: number, isMixed: boolean = false) => {
    let valueItem: ValueItem | undefined;
    if (value.type === "manual") {
      valueItem = (value as ManualValueConfig).values?.[index];
    } else if (value.type === "mixed" && isMixed) {
      valueItem = (value as MixedValueConfig).manualValues[index];
    }

    if (valueItem) {
      setEditingValue({ index, isMixed });
      setEditingValueData({
        value: valueItem.value || "",
        label: valueItem.label || "",
        operator: valueItem.operator || "equal",
        min: valueItem.min?.toString() || "",
        max: valueItem.max?.toString() || "",
      });
    }
  };

  // Cancel editing
  const cancelEditingValue = () => {
    setEditingValue(null);
    setEditingValueData(null);
  };

  // Save edited value
  const saveEditedValue = () => {
    if (!editingValue || !editingValueData) return;

    const { index, isMixed } = editingValue;
    const { value: editValue, label, operator, min, max } = editingValueData;
    const isRangeOp = operator === "range";

    // Validación
    if (isRangeOp) {
      if (!min || !max || !label.trim()) return;
      const minNum = parseFloat(min);
      const maxNum = parseFloat(max);
      if (isNaN(minNum) || isNaN(maxNum) || minNum >= maxNum) return;
    } else {
      if (!editValue.trim()) return;
    }

    const updatedValue: ValueItem = {
      value: isRangeOp ? min : editValue.trim(),
      label: label.trim() || undefined,
      operator: operatorMode === "per-value" ? operator : undefined,
      min: isRangeOp ? parseFloat(min) : undefined,
      max: isRangeOp ? parseFloat(max) : undefined,
    };

    if (value.type === "manual") {
      const manualConfig = value as ManualValueConfig;
      const newValues = [...(manualConfig.values || [])];
      newValues[index] = updatedValue;
      onValueChange({ ...manualConfig, values: newValues });
    } else if (value.type === "mixed" && isMixed) {
      const mixedConfig = value as MixedValueConfig;
      const newManualValues = [...mixedConfig.manualValues];
      newManualValues[index] = updatedValue;
      onValueChange({ ...mixedConfig, manualValues: newManualValues });
    }

    cancelEditingValue();
  };

  // Update value operator (for per-value mode)
  const updateValueOperator = (valueItem: ValueItem, newOperator: FilterOperator, isDynamic: boolean, index: number) => {
    if (value.type === "dynamic") {
      const dynamicConfig = value as DynamicValueConfig;
      const newSelectedValues = [...dynamicConfig.selectedValues];
      newSelectedValues[index] = { ...valueItem, operator: newOperator };
      onValueChange({ ...dynamicConfig, selectedValues: newSelectedValues });
    } else if (value.type === "manual") {
      const manualConfig = value as ManualValueConfig;
      const newValues = [...(manualConfig.values || [])];
      newValues[index] = { ...valueItem, operator: newOperator };
      onValueChange({ ...manualConfig, values: newValues });
    } else if (value.type === "mixed") {
      const mixedConfig = value as MixedValueConfig;
      if (isDynamic) {
        const newDynamicValues = [...mixedConfig.dynamicValues];
        newDynamicValues[index] = { ...valueItem, operator: newOperator };
        onValueChange({ ...mixedConfig, dynamicValues: newDynamicValues });
      } else {
        const newManualValues = [...mixedConfig.manualValues];
        newManualValues[index] = { ...valueItem, operator: newOperator };
        onValueChange({ ...mixedConfig, manualValues: newManualValues });
      }
    }
  };

  // Add range
  const addRange = () => {
    if (!newRangeLabel || !newRangeMin || !newRangeMax) return;
    const min = parseFloat(newRangeMin);
    const max = parseFloat(newRangeMax);
    if (isNaN(min) || isNaN(max) || min >= max) return;

    const defaultOp = getDefaultOperatorForValue();
    const newRange: RangeItem = {
      label: newRangeLabel,
      min,
      max,
      operator: operatorMode === "per-value" ? defaultOp : undefined,
    };

    if (value.type === "manual") {
      const manualConfig = value as ManualValueConfig;
      onValueChange({
        ...manualConfig,
        ranges: [...(manualConfig.ranges || []), newRange],
      });
    } else if (value.type === "mixed") {
      const mixedConfig = value as MixedValueConfig;
      onValueChange({
        ...mixedConfig,
        ranges: [...(mixedConfig.ranges || []), newRange],
      });
    }
    setNewRangeLabel("");
    setNewRangeMin("");
    setNewRangeMax("");
  };

  // Remove range
  const removeRange = (index: number) => {
    if (value.type === "manual") {
      const manualConfig = value as ManualValueConfig;
      const newRanges = (manualConfig.ranges || []).filter((_, i) => i !== index);
      onValueChange({ ...manualConfig, ranges: newRanges });
    } else if (value.type === "mixed") {
      const mixedConfig = value as MixedValueConfig;
      const newRanges = (mixedConfig.ranges || []).filter((_, i) => i !== index);
      onValueChange({ ...mixedConfig, ranges: newRanges });
    }
  };

  // Update range operator
  const updateRangeOperator = (range: RangeItem, newOperator: FilterOperator, index: number) => {
    if (value.type === "manual") {
      const manualConfig = value as ManualValueConfig;
      const newRanges = [...(manualConfig.ranges || [])];
      newRanges[index] = { ...range, operator: newOperator };
      onValueChange({ ...manualConfig, ranges: newRanges });
    } else if (value.type === "mixed") {
      const mixedConfig = value as MixedValueConfig;
      const newRanges = [...(mixedConfig.ranges || [])];
      newRanges[index] = { ...range, operator: newOperator };
      onValueChange({ ...mixedConfig, ranges: newRanges });
    }
  };

  // Handle value type change
  const handleValueTypeChange = (newType: "dynamic" | "manual" | "mixed") => {
    if (newType === "dynamic") {
      onValueChange({
        type: "dynamic",
        selectedValues: [],
      });
    } else if (newType === "manual") {
      if (isRangeOperator) {
        onValueChange({
          type: "manual",
          ranges: [],
        });
      } else {
        onValueChange({
          type: "manual",
          values: [],
        });
      }
    } else if (newType === "mixed") {
      onValueChange({
        type: "mixed",
        dynamicValues: [],
        manualValues: [],
        ranges: isRangeOperator ? [] : undefined,
      });
    }
  };

  if (!column) {
    return (
      <div className="space-y-2">
        <Label>Valores</Label>
        <p className="text-sm text-muted-foreground">
          Selecciona una columna primero para configurar los valores
        </p>
      </div>
    );
  }

  // Determine current tab based on value type
  const currentTab = value.type === "dynamic" ? "dynamic" : value.type === "manual" ? "manual" : "mixed";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Configuración de Valores</Label>
      </div>

      <Tabs value={currentTab} onValueChange={(v) => handleValueTypeChange(v as "dynamic" | "manual" | "mixed")}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dynamic" disabled={!supportsDynamic || disabled}>
            Dinámico
          </TabsTrigger>
          <TabsTrigger value="manual" disabled={disabled}>
            Manual
          </TabsTrigger>
          <TabsTrigger value="mixed" disabled={!supportsDynamic || disabled}>
            Mixto
          </TabsTrigger>
        </TabsList>

        {/* Dynamic Tab */}
        <TabsContent value="dynamic" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {loadingDynamic ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground mb-2">
                    Cargando valores únicos...
                  </p>
                </div>
              ) : dynamicValues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Haz clic en el botón para cargar los valores disponibles desde la API
                  </p>
                  <Button
                    type="button"
                    onClick={fetchDynamicValues}
                    disabled={disabled || !column}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cargar Valores de la API
                  </Button>
                </div>
              ) : (
                (() => {
                  const dynamicConfig = value.type === "dynamic" ? value as DynamicValueConfig : { selectedValues: [] as ValueItem[] };
                  const selectedValues = dynamicConfig.selectedValues.map(v => v.value);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Selecciona los valores a incluir en el filtro</Label>
          <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={fetchDynamicValues}
                            disabled={disabled}
                            title="Recargar valores"
                          >
                            Actualizar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={toggleSelectAllDynamicValues}
                            disabled={disabled || dynamicValues.length === 0}
                          >
                            {dynamicValues.length > 0 && 
                             dynamicValues.every(val => selectedValues.includes(val))
                              ? "Deseleccionar todo"
                              : "Seleccionar todo"}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {dynamicValues.map((val) => {
                          const valueItem = dynamicConfig.selectedValues.find(v => v.value === val);
                          const isSelected = !!valueItem;
                          return (
                            <div
                              key={val}
                              className="flex items-center gap-2 p-2 border rounded hover:bg-muted/50"
                            >
                              <Checkbox
                                id={`dynamic-${val}`}
                                checked={isSelected}
                                onCheckedChange={() => toggleDynamicValue(val)}
              disabled={disabled}
            />
                              <Label
                                htmlFor={`dynamic-${val}`}
                                className="flex-1 cursor-pointer text-sm"
                              >
                                {val}
                              </Label>
                              {isSelected && operatorMode === "per-value" && (
                                <Select
                                  value={valueItem?.operator || "equal"}
                                  onValueChange={(op: FilterOperator) => {
                                    if (valueItem) {
                                      const index = dynamicConfig.selectedValues.findIndex(v => v.value === val);
                                      updateValueOperator(valueItem, op, true, index);
                                    }
                                  }}
                                  disabled={disabled}
                                >
                                  <SelectTrigger className="w-32 h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableOperators.map((op) => (
                                      <SelectItem key={op.value} value={op.value}>
                                        {op.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
          </div>
                          );
                        })}
                      </div>
                      {dynamicConfig.selectedValues.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {dynamicConfig.selectedValues.length} valor(es) seleccionado(s)
                        </p>
        )}
      </div>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Tab */}
        <TabsContent value="manual" className="mt-4">
        <Card>
          <CardContent className="pt-4">
            {isRangeOperator ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Rangos de Valores</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      placeholder="Etiqueta (ej: $500k-$1M)"
                      value={newRangeLabel}
                      onChange={(e) => setNewRangeLabel(e.target.value)}
                      disabled={disabled}
                    />
                    <Input
                      type="number"
                      placeholder="Mínimo"
                      value={newRangeMin}
                      onChange={(e) => setNewRangeMin(e.target.value)}
                      disabled={disabled}
                    />
                    <Input
                      type="number"
                      placeholder="Máximo"
                      value={newRangeMax}
                      onChange={(e) => setNewRangeMax(e.target.value)}
                      disabled={disabled}
                    />
                    <Button
                      type="button"
                      onClick={addRange}
                      disabled={disabled || !newRangeLabel || !newRangeMin || !newRangeMax}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                  {value.type === "manual" && value.ranges && value.ranges.length > 0 && (
                  <div className="space-y-2">
                    {value.ranges.map((range, index) => (
                      <div
                        key={index}
                          className="flex items-center justify-between p-2 border rounded gap-2"
                      >
                          <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm">
                          {range.label}: {range.min} - {range.max}
                        </span>
                            {operatorMode === "per-value" && (
                              <Select
                                value={range.operator || "equal"}
                                onValueChange={(op: FilterOperator) => updateRangeOperator(range, op, index)}
                                disabled={disabled}
                              >
                                <SelectTrigger className="w-32 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableOperators.map((op) => (
                                    <SelectItem key={op.value} value={op.value}>
                                      {op.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRange(index)}
                          disabled={disabled}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Valores de Lista</Label>
                    {operatorMode === "per-value" && newManualOperator === "range" ? (
                      // UI para rangos cuando el operador es "range"
                      <div className="grid grid-cols-5 gap-2">
                    <Input
                          placeholder="Etiqueta *"
                          value={newManualLabel}
                          onChange={(e) => setNewManualLabel(e.target.value)}
                          disabled={disabled}
                        />
                        <Input
                          type="number"
                          placeholder="Mínimo *"
                          value={newManualMin}
                          onChange={(e) => setNewManualMin(e.target.value)}
                          disabled={disabled}
                        />
                        <Input
                          type="number"
                          placeholder="Máximo *"
                          value={newManualMax}
                          onChange={(e) => setNewManualMax(e.target.value)}
                          disabled={disabled}
                        />
                        <Select
                          value={newManualOperator}
                          onValueChange={(op: FilterOperator) => {
                            setNewManualOperator(op);
                            // Limpiar campos cuando se cambia de operador
                            if (op !== "range") {
                              setNewManualMin("");
                              setNewManualMax("");
                        }
                      }}
                      disabled={disabled}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableOperators.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={addManualValue}
                          disabled={disabled || !newManualLabel.trim() || !newManualMin || !newManualMax || !newManualOperator}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      // UI normal para valores no-rango
                      <div className={`grid gap-2 ${operatorMode === "per-value" ? "grid-cols-4" : "grid-cols-3"}`}>
                        <Input
                          placeholder="Valor de comparación *"
                          value={newManualValue}
                          onChange={(e) => setNewManualValue(e.target.value)}
                      disabled={disabled}
                    />
                        <Input
                          placeholder="Etiqueta (opcional)"
                          value={newManualLabel}
                          onChange={(e) => setNewManualLabel(e.target.value)}
                          disabled={disabled}
                        />
                        {operatorMode === "per-value" && (
                          <Select
                            value={newManualOperator}
                            onValueChange={(op: FilterOperator) => {
                              setNewManualOperator(op);
                              // Limpiar campos cuando se cambia a range
                              if (op === "range") {
                                setNewManualValue("");
                              }
                            }}
                            disabled={disabled}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableOperators.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                    <Button
                      type="button"
                          onClick={addManualValue}
                          disabled={disabled || !newManualValue.trim() || (operatorMode === "per-value" && !newManualOperator)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {operatorMode === "per-value" && newManualOperator === "range" 
                        ? "Para rangos, ingresa etiqueta, valor mínimo y máximo. Todos son obligatorios."
                        : "El valor de comparación es obligatorio. La etiqueta es opcional y se usará para mostrar en el frontend."}
                      {operatorMode === "per-value" && newManualOperator !== "range" && " Debes seleccionar un operador antes de agregar el valor."}
                    </p>
                </div>
                  {value.type === "manual" && value.values && value.values.length > 0 && (
                    <div className="space-y-2">
                      {value.values.map((valueItem, index) => {
                        const isRangeValue = valueItem.operator === "range";
                        const isEditing = editingValue?.index === index && !editingValue.isMixed;
                        const editData = isEditing ? editingValueData : null;
                        const isRangeEdit = editData?.operator === "range";

                        return (
                          <div
                        key={index}
                            className="flex items-center justify-between p-2 border rounded gap-2"
                          >
                            {isEditing ? (
                              <>
                                <div className="flex items-center gap-2 flex-1">
                                  {isRangeEdit && editData ? (
                                    <div className="grid grid-cols-4 gap-2 flex-1">
                                      <Input
                                        placeholder="Etiqueta *"
                                        value={editData.label}
                                        onChange={(e) => setEditingValueData({ ...editData, label: e.target.value })}
                                        disabled={disabled}
                                      />
                                      <Input
                                        type="number"
                                        placeholder="Mínimo *"
                                        value={editData.min}
                                        onChange={(e) => setEditingValueData({ ...editData, min: e.target.value })}
                                        disabled={disabled}
                                      />
                                      <Input
                                        type="number"
                                        placeholder="Máximo *"
                                        value={editData.max}
                                        onChange={(e) => setEditingValueData({ ...editData, max: e.target.value })}
                                        disabled={disabled}
                                      />
                                      {operatorMode === "per-value" && (
                                        <Select
                                          value={editData.operator}
                                          onValueChange={(op: FilterOperator) => {
                                            if (editData) {
                                              if (op !== "range") {
                                                setEditingValueData({ ...editData, operator: op, min: "", max: "" });
                                              } else {
                                                setEditingValueData({ ...editData, operator: op });
                                              }
                                            }
                                          }}
                                          disabled={disabled}
                                        >
                                          <SelectTrigger className="w-32 h-7 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableOperators.map((op) => (
                                              <SelectItem key={op.value} value={op.value}>
                                                {op.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </div>
                                  ) : editData ? (
                                    <div className={`grid gap-2 flex-1 ${operatorMode === "per-value" ? "grid-cols-3" : "grid-cols-2"}`}>
                                      <Input
                                        placeholder="Valor *"
                                        value={editData.value}
                                        onChange={(e) => setEditingValueData({ ...editData, value: e.target.value })}
                                        disabled={disabled}
                                      />
                                      <Input
                                        placeholder="Etiqueta (opcional)"
                                        value={editData.label}
                                        onChange={(e) => setEditingValueData({ ...editData, label: e.target.value })}
                                        disabled={disabled}
                                      />
                                      {operatorMode === "per-value" && (
                                        <Select
                                          value={editData.operator}
                                          onValueChange={(op: FilterOperator) => {
                                            if (editData) {
                                              if (op === "range") {
                                                setEditingValueData({ ...editData, operator: op, value: "" });
                                              } else {
                                                setEditingValueData({ ...editData, operator: op });
                                              }
                                            }
                                          }}
                                          disabled={disabled}
                                        >
                                          <SelectTrigger className="w-32 h-7 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableOperators.map((op) => (
                                              <SelectItem key={op.value} value={op.value}>
                                                {op.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                          type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={saveEditedValue}
                                    disabled={disabled || !editData || (isRangeEdit ? (!editData.label.trim() || !editData.min || !editData.max) : !editData.value.trim())}
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelEditingValue}
                          disabled={disabled}
                        >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 flex-1">
                                  {isRangeValue ? (
                                    <Badge variant="secondary" className="flex flex-col items-start gap-1">
                                      <span>{valueItem.label || `${valueItem.min} - ${valueItem.max}`}</span>
                                      <span className="text-xs text-muted-foreground font-normal">
                                        Rango: {valueItem.min} - {valueItem.max}
                                      </span>
                      </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="flex flex-col items-start gap-1">
                                      <span>{valueItem.label || valueItem.value}</span>
                                      {valueItem.label && (
                                        <span className="text-xs text-muted-foreground font-normal">
                                          Valor: {valueItem.value}
                                        </span>
                                      )}
                                    </Badge>
                                  )}
                                  {operatorMode === "per-value" && (
                                    <Select
                                      value={valueItem.operator || "equal"}
                                      onValueChange={(op: FilterOperator) => updateValueOperator(valueItem, op, false, index)}
                                      disabled={disabled}
                                    >
                                      <SelectTrigger className="w-32 h-7 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableOperators.map((op) => (
                                          <SelectItem key={op.value} value={op.value}>
                                            {op.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                  </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditingValue(index, false)}
                                    disabled={disabled}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeManualValue(index)}
                                    disabled={disabled}
                                  >
                                    <X className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        {/* Mixed Tab */}
        <TabsContent value="mixed" className="mt-4">
        <Card>
            <CardContent className="pt-4 space-y-6">
              {/* Dynamic Values Section */}
              <div className="space-y-2">
                <Label>Valores Dinámicos</Label>
            {loadingDynamic ? (
                  <p className="text-sm text-muted-foreground">Cargando valores únicos...</p>
            ) : dynamicValues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      Cargar valores desde la API
                    </p>
                    <Button
                      type="button"
                      onClick={fetchDynamicValues}
                      disabled={disabled || !column}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Cargar Valores
                    </Button>
                  </div>
                ) : (
                  (() => {
                    const mixedConfig = value.type === "mixed" ? value as MixedValueConfig : { dynamicValues: [] as ValueItem[] };
                    const selectedValues = mixedConfig.dynamicValues.map(v => v.value);
                    return (
              <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Selecciona valores dinámicos</span>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={fetchDynamicValues}
                              disabled={disabled}
                            >
                              Actualizar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={toggleSelectAllDynamicValues}
                              disabled={disabled || dynamicValues.length === 0}
                            >
                              {dynamicValues.length > 0 && 
                               dynamicValues.every(val => selectedValues.includes(val))
                                ? "Deseleccionar todo"
                                : "Seleccionar todo"}
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {dynamicValues.map((val) => {
                            const valueItem = mixedConfig.dynamicValues.find(v => v.value === val);
                            const isSelected = !!valueItem;
                            return (
                    <div
                      key={val}
                      className="flex items-center gap-2 p-2 border rounded hover:bg-muted/50"
                    >
                      <Checkbox
                                  id={`mixed-dynamic-${val}`}
                                  checked={isSelected}
                        onCheckedChange={() => toggleDynamicValue(val)}
                        disabled={disabled}
                      />
                      <Label
                                  htmlFor={`mixed-dynamic-${val}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {val}
                      </Label>
                                {isSelected && operatorMode === "per-value" && (
                                  <Select
                                    value={valueItem?.operator || "equal"}
                                    onValueChange={(op: FilterOperator) => {
                                      if (valueItem) {
                                        const index = mixedConfig.dynamicValues.findIndex(v => v.value === val);
                                        updateValueOperator(valueItem, op, true, index);
                                      }
                                    }}
                                    disabled={disabled}
                                  >
                                    <SelectTrigger className="w-32 h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableOperators.map((op) => (
                                        <SelectItem key={op.value} value={op.value}>
                                          {op.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                    </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Manual Values Section */}
              <div className="space-y-2 border-t pt-4">
                <Label>Valores Manuales</Label>
                {operatorMode === "per-value" && newManualOperator === "range" ? (
                  // UI para rangos cuando el operador es "range"
                  <div className="grid grid-cols-5 gap-2">
                    <Input
                      placeholder="Etiqueta *"
                      value={newManualLabel}
                      onChange={(e) => setNewManualLabel(e.target.value)}
                      disabled={disabled}
                    />
                    <Input
                      type="number"
                      placeholder="Mínimo *"
                      value={newManualMin}
                      onChange={(e) => setNewManualMin(e.target.value)}
                      disabled={disabled}
                    />
                    <Input
                      type="number"
                      placeholder="Máximo *"
                      value={newManualMax}
                      onChange={(e) => setNewManualMax(e.target.value)}
                      disabled={disabled}
                    />
                    <Select
                      value={newManualOperator}
                      onValueChange={(op: FilterOperator) => {
                        setNewManualOperator(op);
                        // Limpiar campos cuando se cambia de operador
                        if (op !== "range") {
                          setNewManualMin("");
                          setNewManualMax("");
                        }
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOperators.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={addManualValue}
                      disabled={disabled || !newManualLabel.trim() || !newManualMin || !newManualMax || !newManualOperator}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                </div>
                ) : (
                  // UI normal para valores no-rango
                  <div className={`grid gap-2 ${operatorMode === "per-value" ? "grid-cols-4" : "grid-cols-3"}`}>
                    <Input
                      placeholder="Valor de comparación *"
                      value={newManualValue}
                      onChange={(e) => setNewManualValue(e.target.value)}
                      disabled={disabled}
                    />
                    <Input
                      placeholder="Etiqueta (opcional)"
                      value={newManualLabel}
                      onChange={(e) => setNewManualLabel(e.target.value)}
                      disabled={disabled}
                    />
                    {operatorMode === "per-value" && (
                      <Select
                        value={newManualOperator}
                        onValueChange={(op: FilterOperator) => {
                          setNewManualOperator(op);
                          // Limpiar campos cuando se cambia a range
                          if (op === "range") {
                            setNewManualValue("");
                          }
                        }}
                        disabled={disabled}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOperators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      type="button"
                      onClick={addManualValue}
                      disabled={disabled || !newManualValue.trim() || (operatorMode === "per-value" && !newManualOperator)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                  <p className="text-xs text-muted-foreground">
                  {operatorMode === "per-value" && newManualOperator === "range" 
                    ? "Para rangos, ingresa etiqueta, valor mínimo y máximo. Todos son obligatorios."
                    : "El valor de comparación es obligatorio. La etiqueta es opcional y se usará para mostrar en el frontend."}
                  {operatorMode === "per-value" && newManualOperator !== "range" && " Debes seleccionar un operador antes de agregar el valor."}
                </p>
                {value.type === "mixed" && value.manualValues && value.manualValues.length > 0 && (
                  <div className="space-y-2">
                    {value.manualValues.map((valueItem, index) => {
                      const isRangeValue = valueItem.operator === "range";
                      const isEditing = editingValue?.index === index && editingValue.isMixed;
                      const editData = isEditing ? editingValueData : null;
                      const isRangeEdit = editData?.operator === "range";

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded gap-2"
                        >
                          {isEditing ? (
                            <>
                              <div className="flex items-center gap-2 flex-1">
                                {isRangeEdit && editData ? (
                                  <div className="grid grid-cols-4 gap-2 flex-1">
                                    <Input
                                      placeholder="Etiqueta *"
                                      value={editData.label}
                                      onChange={(e) => setEditingValueData({ ...editData, label: e.target.value })}
                                      disabled={disabled}
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Mínimo *"
                                      value={editData.min}
                                      onChange={(e) => setEditingValueData({ ...editData, min: e.target.value })}
                                      disabled={disabled}
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Máximo *"
                                      value={editData.max}
                                      onChange={(e) => setEditingValueData({ ...editData, max: e.target.value })}
                                      disabled={disabled}
                                    />
                                    {operatorMode === "per-value" && (
                                      <Select
                                        value={editData.operator}
                                        onValueChange={(op: FilterOperator) => {
                                          if (editData) {
                                            if (op !== "range") {
                                              setEditingValueData({ ...editData, operator: op, min: "", max: "" });
                                            } else {
                                              setEditingValueData({ ...editData, operator: op });
                                            }
                                          }
                                        }}
                                        disabled={disabled}
                                      >
                                        <SelectTrigger className="w-32 h-7 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availableOperators.map((op) => (
                                            <SelectItem key={op.value} value={op.value}>
                                              {op.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                ) : editData ? (
                                  <div className={`grid gap-2 flex-1 ${operatorMode === "per-value" ? "grid-cols-3" : "grid-cols-2"}`}>
                                    <Input
                                      placeholder="Valor *"
                                      value={editData.value}
                                      onChange={(e) => setEditingValueData({ ...editData, value: e.target.value })}
                                      disabled={disabled}
                                    />
                                    <Input
                                      placeholder="Etiqueta (opcional)"
                                      value={editData.label}
                                      onChange={(e) => setEditingValueData({ ...editData, label: e.target.value })}
                                      disabled={disabled}
                                    />
                                    {operatorMode === "per-value" && (
                                      <Select
                                        value={editData.operator}
                                        onValueChange={(op: FilterOperator) => {
                                          if (editData) {
                                            if (op === "range") {
                                              setEditingValueData({ ...editData, operator: op, value: "" });
                                            } else {
                                              setEditingValueData({ ...editData, operator: op });
                                            }
                                          }
                                        }}
                                        disabled={disabled}
                                      >
                                        <SelectTrigger className="w-32 h-7 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availableOperators.map((op) => (
                                            <SelectItem key={op.value} value={op.value}>
                                              {op.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={saveEditedValue}
                                  disabled={disabled || !editData || (isRangeEdit ? (!editData.label.trim() || !editData.min || !editData.max) : !editData.value.trim())}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEditingValue}
                                  disabled={disabled}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 flex-1">
                                {isRangeValue ? (
                                  <Badge variant="secondary" className="flex flex-col items-start gap-1">
                                    <span>{valueItem.label || `${valueItem.min} - ${valueItem.max}`}</span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                      Rango: {valueItem.min} - {valueItem.max}
                                    </span>
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="flex flex-col items-start gap-1">
                                    <span>{valueItem.label || valueItem.value}</span>
                                    {valueItem.label && (
                                      <span className="text-xs text-muted-foreground font-normal">
                                        Valor: {valueItem.value}
                                      </span>
                                    )}
                                  </Badge>
                                )}
                                {operatorMode === "per-value" && (
                                  <Select
                                    value={valueItem.operator || "equal"}
                                    onValueChange={(op: FilterOperator) => updateValueOperator(valueItem, op, false, index)}
                                    disabled={disabled}
                                  >
                                    <SelectTrigger className="w-32 h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableOperators.map((op) => (
                                        <SelectItem key={op.value} value={op.value}>
                                          {op.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditingValue(index, true)}
                                  disabled={disabled}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeManualValue(index, true)}
                                  disabled={disabled}
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ranges Section (if range operator) */}
              {isRangeOperator && (
                <div className="space-y-2 border-t pt-4">
                  <Label>Rangos</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      placeholder="Etiqueta"
                      value={newRangeLabel}
                      onChange={(e) => setNewRangeLabel(e.target.value)}
                      disabled={disabled}
                    />
                    <Input
                      type="number"
                      placeholder="Mínimo"
                      value={newRangeMin}
                      onChange={(e) => setNewRangeMin(e.target.value)}
                      disabled={disabled}
                    />
                    <Input
                      type="number"
                      placeholder="Máximo"
                      value={newRangeMax}
                      onChange={(e) => setNewRangeMax(e.target.value)}
                      disabled={disabled}
                    />
                    <Button
                      type="button"
                      onClick={addRange}
                      disabled={disabled || !newRangeLabel || !newRangeMin || !newRangeMax}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {value.type === "mixed" && value.ranges && value.ranges.length > 0 && (
                    <div className="space-y-2">
                      {value.ranges.map((range, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded gap-2"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm">
                              {range.label}: {range.min} - {range.max}
                            </span>
                            {operatorMode === "per-value" && (
                              <Select
                                value={range.operator || "equal"}
                                onValueChange={(op: FilterOperator) => updateRangeOperator(range, op, index)}
                                disabled={disabled}
                              >
                                <SelectTrigger className="w-32 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableOperators.map((op) => (
                                    <SelectItem key={op.value} value={op.value}>
                                      {op.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRange(index)}
                            disabled={disabled}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
