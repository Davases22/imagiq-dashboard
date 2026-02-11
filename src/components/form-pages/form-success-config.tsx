"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { FormSuccessConfig } from "@/types/form-page";
import { LinkTextInput } from "./link-text-input";

interface FormSuccessConfigComponentProps {
  config: FormSuccessConfig;
  onConfigChange: (config: FormSuccessConfig) => void;
}

export function FormSuccessConfigComponent({
  config,
  onConfigChange,
}: FormSuccessConfigComponentProps) {
  return (
    <div className="space-y-4">
      <RadioGroup
        value={config.type}
        onValueChange={(v) =>
          onConfigChange({ ...config, type: v as "message" | "redirect" })
        }
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="message" id="success-message" />
          <Label htmlFor="success-message">Mostrar mensaje de éxito</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="redirect" id="success-redirect" />
          <Label htmlFor="success-redirect">Redirigir a una URL</Label>
        </div>
      </RadioGroup>

      {config.type === "message" ? (
        <div className="space-y-1">
          <Label className="text-xs">Mensaje de éxito</Label>
          <LinkTextInput
            value={config.message || ""}
            onChange={(value) => onConfigChange({ ...config, message: value })}
            placeholder="¡Gracias! Tu respuesta ha sido enviada exitosamente."
            multiline
            rows={3}
          />
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-xs">URL de redirección</Label>
          <Input
            type="url"
            value={config.redirect_url || ""}
            onChange={(e) => onConfigChange({ ...config, redirect_url: e.target.value })}
            placeholder="https://ejemplo.com/gracias"
          />
        </div>
      )}
    </div>
  );
}
