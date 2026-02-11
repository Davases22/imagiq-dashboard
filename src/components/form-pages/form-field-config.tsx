"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { FormFieldDefinition } from "@/types/form-page";

interface FormFieldConfigProps {
  field: FormFieldDefinition;
  onUpdate: (updates: Partial<FormFieldDefinition>) => void;
}

export function FormFieldConfig({ field, onUpdate }: FormFieldConfigProps) {
  const hasOptions = ["select", "radio", "checkbox"].includes(field.type);

  const handleAddOption = () => {
    const options = [...(field.options || []), `Opción ${(field.options?.length || 0) + 1}`];
    onUpdate({ options });
  };

  const handleRemoveOption = (index: number) => {
    const options = (field.options || []).filter((_, i) => i !== index);
    onUpdate({ options });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const options = [...(field.options || [])];
    options[index] = value;
    onUpdate({ options });
  };

  return (
    <div className="space-y-4">
      {/* Label & Placeholder */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Etiqueta</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Nombre del campo"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={field.placeholder || ""}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Texto de ayuda"
          />
        </div>
      </div>

      {/* Required & Width */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            checked={field.required}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
          <Label className="text-sm">Obligatorio</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Ancho:</Label>
          <Select value={field.width} onValueChange={(v) => onUpdate({ width: v as "full" | "half" })}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Completo</SelectItem>
              <SelectItem value="half">Medio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Address field info */}
      {field.type === "address" && (
        <p className="text-xs text-muted-foreground">
          Este campo muestra autocompletado de direcciones con Google Places.
        </p>
      )}

      {/* Options (for select/radio/checkbox) */}
      {hasOptions && (
        <div className="space-y-2">
          <Label className="text-xs">Opciones</Label>
          {(field.options || []).map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={option}
                onChange={(e) => handleUpdateOption(index, e.target.value)}
                placeholder={`Opción ${index + 1}`}
                className="h-8"
              />
              {(field.options?.length || 0) > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOption(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
            <Plus className="mr-1 h-3 w-3" /> Agregar opción
          </Button>
        </div>
      )}

      {/* Validation (for text/email/phone/textarea/number) */}
      {["text", "email", "phone", "textarea", "number"].includes(field.type) && (
        <div className="space-y-2">
          <Label className="text-xs">Validación</Label>
          <div className="grid grid-cols-2 gap-3">
            {field.type !== "number" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Mín. caracteres</Label>
                  <Input
                    type="number"
                    value={field.validation?.min_length || ""}
                    onChange={(e) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          min_length: e.target.value ? Number(e.target.value) : undefined,
                        },
                      })
                    }
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Máx. caracteres</Label>
                  <Input
                    type="number"
                    value={field.validation?.max_length || ""}
                    onChange={(e) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          max_length: e.target.value ? Number(e.target.value) : undefined,
                        },
                      })
                    }
                    className="h-8"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
