"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormStyleConfigProps {
  submitButtonText: string;
  onSubmitButtonTextChange: (text: string) => void;
}

export function FormStyleConfig({
  submitButtonText,
  onSubmitButtonTextChange,
}: FormStyleConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Texto del botón de envío</Label>
        <Input
          value={submitButtonText}
          onChange={(e) => onSubmitButtonTextChange(e.target.value)}
          placeholder="Enviar"
        />
      </div>
    </div>
  );
}
