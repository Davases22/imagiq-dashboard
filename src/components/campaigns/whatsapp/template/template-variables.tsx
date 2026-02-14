"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

interface TemplateVariablesProps {
  bodyText: string;
  headerText?: string;
  variableValues: Record<string, string>;
  onVariableValuesChange: (values: Record<string, string>) => void;
}

export function TemplateVariables({
  bodyText,
  headerText,
  variableValues,
  onVariableValuesChange,
}: TemplateVariablesProps) {
  // Check if {{1}} is used in body or header
  const hasVariable = /\{\{1\}\}/.test(bodyText || "") || /\{\{1\}\}/.test(headerText || "");

  if (!hasVariable) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-2">
          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">
              Variable del Nombre
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {"{{1}}"} se reemplazará con el nombre del cliente al enviar
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="var-name" className="text-xs">
            Nombre de ejemplo (para vista previa)
          </Label>
          <Input
            id="var-name"
            placeholder="Ej: Juan"
            value={variableValues["{{1}}"] || ""}
            onChange={(e) =>
              onVariableValuesChange({ "{{1}}": e.target.value })
            }
            className="mt-1 text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
