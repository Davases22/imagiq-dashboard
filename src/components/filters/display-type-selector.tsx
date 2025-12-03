"use client";

import { useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FilterDisplayType, FilterOperator } from "@/types/filters";
import { CheckSquare, Circle, SlidersHorizontal, List } from "lucide-react";
import { useDisplayTypes } from "@/hooks/use-display-types";

interface DisplayTypeSelectorProps {
  value: FilterDisplayType;
  onValueChange: (value: FilterDisplayType) => void;
  operator: FilterOperator;
  columnKey: string;
  disabled?: boolean;
}

// Helper function to map icon names to React components
function getIconComponent(iconName?: string): React.ComponentType<{ className?: string }> {
  switch (iconName) {
    case "CheckSquare":
      return CheckSquare;
    case "Circle":
      return Circle;
    case "SlidersHorizontal":
      return SlidersHorizontal;
    case "List":
      return List;
    default:
      return CheckSquare;
  }
}

export function DisplayTypeSelector({
  value,
  onValueChange,
  operator,
  columnKey,
  disabled = false,
}: DisplayTypeSelectorProps) {
  const { displayTypes, isLoading, error } = useDisplayTypes({
    columnKey,
    operator,
  });

  // Filter out "single-select" and "multi-select" as they are not available
  // These display types are commented out/disabled and should not appear in the selector
  // Check both value and label to catch different formats (e.g., "single-select", "singleSelect", "Single Select", etc.)
  const availableTypes = useMemo(() => {
    return (displayTypes?.availableTypes || []).filter((type) => {
      const valueLower = type.value.toLowerCase().replace(/[-\s]/g, "");
      const labelLower = type.label.toLowerCase().replace(/[-\s]/g, "");
      const isSingleSelect = 
        valueLower.includes("singleselect") || 
        labelLower.includes("singleselect") ||
        type.value === "single-select" ||
        type.value === "singleSelect";
      const isMultiSelect = 
        valueLower.includes("multiselect") || 
        labelLower.includes("multiselect") ||
        type.value === "multi-select" ||
        type.value === "multiSelect";
      return !isSingleSelect && !isMultiSelect;
    });
  }, [displayTypes?.availableTypes]);

  // Update to defaultType when displayTypes change and current value is not available
  useEffect(() => {
    if (availableTypes.length > 0) {
      const isCurrentValueAvailable = availableTypes.some(
        (type) => type.value === value
      );
      if (!isCurrentValueAvailable) {
        // Find a valid default type from filtered types
        const defaultType = displayTypes?.defaultType;
        const defaultTypeIsAvailable = availableTypes.some(
          (type) => type.value === defaultType
        );
        if (defaultTypeIsAvailable && defaultType) {
          onValueChange(defaultType);
        } else if (availableTypes.length > 0) {
          // Use first available type if default is not available
          onValueChange(availableTypes[0].value);
        }
      }
    }
  }, [displayTypes, value, onValueChange, availableTypes]);
  const selectedType = availableTypes.find((type) => type.value === value);
  const Icon = getIconComponent(selectedType?.icon);

  return (
    <div className="space-y-2">
      <Label htmlFor="display-type-selector">Tipo de Visualización</Label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isLoading || !columnKey}
      >
        <SelectTrigger id="display-type-selector">
          <SelectValue
            placeholder={
              isLoading
                ? "Cargando..."
                : error
                ? "Error al cargar"
                : !columnKey
                ? "Selecciona una columna primero"
                : availableTypes.length === 0
                ? "No hay tipos disponibles"
                : "Selecciona un tipo"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Cargando tipos de visualización...
            </div>
          ) : error ? (
            <div className="px-2 py-1.5 text-sm text-destructive">
              {error}
            </div>
          ) : availableTypes.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No hay tipos de visualización disponibles
            </div>
          ) : (
            availableTypes.map((type) => {
              const TypeIcon = getIconComponent(type.icon);
              return (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {type.description}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
      {selectedType && (
        <Card className="mt-2">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Preview: {selectedType.label}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedType.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {displayTypes?.reason && (
        <p className="text-xs text-muted-foreground mt-1">
          {displayTypes.reason}
        </p>
      )}
    </div>
  );
}

