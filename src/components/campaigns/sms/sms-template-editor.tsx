"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Link2, Save, Variable } from "lucide-react";

const MAX_SMS_LENGTH = 160;
const MAX_CONCATENATED_LENGTH = 153; // Para SMS concatenados

interface SmsTemplateEditorProps {
  initialName?: string;
  initialMessage?: string;
  initialCategory?: string;
  onSave?: (data: { name: string; message: string; category: string }) => void;
  onMessageChange?: (message: string) => void;
}

const VARIABLES = [
  { label: "Nombre", value: "nombre", example: "Juan" },
  { label: "Apellido", value: "apellido", example: "Pérez" },
  { label: "Email", value: "email", example: "juan@email.com" },
  { label: "Teléfono", value: "telefono", example: "+573001234567" },
  { label: "Empresa", value: "empresa", example: "IMAGIQ" },
  { label: "Código", value: "codigo", example: "ABC123" },
  { label: "Descuento", value: "descuento", example: "20%" },
  { label: "Fecha", value: "fecha", example: "15/01/2026" },
];

const CATEGORIES = [
  { value: "promotional", label: "Promocional" },
  { value: "transactional", label: "Transaccional" },
  { value: "reminder", label: "Recordatorio" },
  { value: "alert", label: "Alerta" },
];

export function SmsTemplateEditor({
  initialName = "",
  initialMessage = "",
  initialCategory = "promotional",
  onSave,
  onMessageChange,
}: SmsTemplateEditorProps) {
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState(initialMessage);
  const [category, setCategory] = useState(initialCategory);

  // Calcular estadísticas del mensaje
  const stats = useMemo(() => {
    const length = message.length;
    const isOverLimit = length > MAX_SMS_LENGTH;
    const segments = length <= MAX_SMS_LENGTH ? 1 : Math.ceil(length / MAX_CONCATENATED_LENGTH);
    const remainingInSegment = length <= MAX_SMS_LENGTH
      ? MAX_SMS_LENGTH - length
      : MAX_CONCATENATED_LENGTH - (length % MAX_CONCATENATED_LENGTH);

    // Detectar variables usadas
    const variablesUsed = VARIABLES.filter(v => message.includes(`{{${v.value}}}`));

    // Preview con variables reemplazadas
    let previewMessage = message;
    VARIABLES.forEach(v => {
      previewMessage = previewMessage.replace(new RegExp(`\\{\\{${v.value}\\}\\}`, 'g'), v.example);
    });

    return {
      length,
      isOverLimit,
      segments,
      remainingInSegment,
      variablesUsed,
      previewMessage,
      previewLength: previewMessage.length,
    };
  }, [message]);

  const handleInsertVariable = (variable: string) => {
    const newMessage = message + `{{${variable}}}`;
    setMessage(newMessage);
    onMessageChange?.(newMessage);
  };

  const handleInsertLink = () => {
    const link = prompt("Ingresa la URL del enlace:");
    if (link) {
      // Acortar la URL visualmente pero mantener el link
      const shortLink = link.length > 30 ? link.substring(0, 27) + "..." : link;
      const newMessage = message + ` ${link}`;
      setMessage(newMessage);
      onMessageChange?.(newMessage);
    }
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);
    onMessageChange?.(value);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Por favor ingresa un nombre para el template");
      return;
    }
    if (!message.trim()) {
      alert("Por favor ingresa el mensaje del template");
      return;
    }
    onSave?.({ name, message, category });
  };

  return (
    <div className="space-y-4">
      {/* Nombre del Template */}
      <div className="space-y-2">
        <Label htmlFor="templateName">Nombre del Template</Label>
        <Input
          id="templateName"
          placeholder="Ej: Promoción Fin de Semana"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Categoría */}
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Editor del Mensaje */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="message">Mensaje SMS</Label>
          <div className="flex items-center gap-2">
            <Badge
              variant={stats.isOverLimit ? "destructive" : stats.length > 140 ? "secondary" : "outline"}
            >
              {stats.length}/{MAX_SMS_LENGTH}
            </Badge>
            {stats.segments > 1 && (
              <Badge variant="secondary">
                {stats.segments} SMS
              </Badge>
            )}
          </div>
        </div>

        <Textarea
          id="message"
          rows={4}
          placeholder="Escribe tu mensaje SMS aquí... Máximo 160 caracteres por SMS."
          value={message}
          onChange={(e) => handleMessageChange(e.target.value)}
          className={stats.isOverLimit ? "border-orange-500 focus:border-orange-500" : ""}
        />

        {/* Barra de caracteres restantes */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              stats.length > MAX_SMS_LENGTH
                ? "bg-orange-500"
                : stats.length > 140
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{ width: `${Math.min((stats.length / MAX_SMS_LENGTH) * 100, 100)}%` }}
          />
        </div>

        {stats.isOverLimit && (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <AlertCircle className="h-4 w-4" />
            El mensaje excede 160 caracteres. Se enviará como {stats.segments} SMS concatenados.
          </div>
        )}
      </div>

      {/* Botones de inserción */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Variable className="h-4 w-4" />
          Variables de Personalización
        </Label>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map((variable) => (
            <Button
              key={variable.value}
              variant="outline"
              size="sm"
              onClick={() => handleInsertVariable(variable.value)}
              className="text-xs"
            >
              {`{${variable.label}}`}
            </Button>
          ))}
        </div>
      </div>

      {/* Insertar Link */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleInsertLink}
          className="gap-2"
        >
          <Link2 className="h-4 w-4" />
          Insertar Link
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          Los links ocupan caracteres. Considera usar acortadores como bit.ly
        </p>
      </div>

      {/* Preview */}
      {stats.variablesUsed.length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Vista Previa (con datos de ejemplo)</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <p className="text-sm whitespace-pre-wrap">{stats.previewMessage}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              Longitud con datos reales: ~{stats.previewLength} caracteres
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón Guardar */}
      {onSave && (
        <Button onClick={handleSave} className="w-full gap-2">
          <Save className="h-4 w-4" />
          Guardar Template
        </Button>
      )}
    </div>
  );
}
