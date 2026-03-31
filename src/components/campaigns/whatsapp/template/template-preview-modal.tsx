"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Apple, Smartphone } from "lucide-react";
import { WhatsAppTemplatePreview } from "./template-preview";
import { WhatsAppTemplate } from "@/types";

interface TemplatePreviewModalProps {
  template: WhatsAppTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TemplatePreviewModal({ template, isOpen, onClose }: TemplatePreviewModalProps) {
  const [selectedOS, setSelectedOS] = useState<'ios' | 'android'>('ios');

  if (!template) return null;

  // Convertir template a formato esperado por el preview
  const templateData = {
    name: template.name,
    category: template.category,
    language: template.language,
    header: template.header,
    body: template.body,
    footer: template.footer,
    buttons: template.buttons,
  };

  // Generar valores de ejemplo para las variables
  const variableValues: Record<string, string> = {};
  
  // Detectar todas las variables en header, body y footer
  const allVariables = [
    ...(template.header.content?.match(/\{\{\d+\}\}/g) || []),
    ...(template.body.match(/\{\{\d+\}\}/g) || []),
    ...(template.footer?.match(/\{\{\d+\}\}/g) || [])
  ];
  
  const uniqueVariables = [...new Set(allVariables)];
  
  // Intentar usar los examples del template si existen
  const hasExamples = template.variables && template.variables.length > 0;
  
  uniqueVariables.forEach((variable) => {
    const varNumber = parseInt(variable.replace(/[{}]/g, ''));
    
    if (hasExamples && template.variables && template.variables[varNumber - 1]) {
      // Usar el example del template si existe
      variableValues[variable] = template.variables[varNumber - 1];
    } else {
      // Usar nombre descriptivo para la primera variable (nombre del cliente)
      variableValues[variable] = varNumber === 1 ? 'nombre del cliente' : `var${varNumber}`;
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[65vw] w-[65vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                Vista Previa - {template.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1 flex items-center flex-wrap gap-1">
                <span>
                  {template.category} • {template.language.toUpperCase()} • Estado: {
                    template.status === 'active' ? 'Activa' :
                    template.status === 'pending' ? 'Pendiente' :
                    template.status === 'rejected' ? 'Rechazada' : 'Inactiva'
                  }
                </span>
                {uniqueVariables.length > 0 && (
                  <>
                    <span>• Variables:</span>
                    {uniqueVariables.map((v) => (
                      <Badge
                        key={v}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 bg-muted/50 border-muted-foreground/30"
                      >
                        var{parseInt(v.replace(/[{}]/g, ''))}
                      </Badge>
                    ))}
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant={selectedOS === 'ios' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedOS('ios')}
                className="text-xs flex items-center gap-1 h-7 px-2"
              >
                <Apple className="h-3 w-3" />
                iOS
              </Button>
              <Button
                variant={selectedOS === 'android' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedOS('android')}
                className="text-xs flex items-center gap-1 h-7 px-2"
              >
                <Smartphone className="h-3 w-3" />
                Android
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto mt-6 min-h-0 px-4">
          <WhatsAppTemplatePreview
            templateData={templateData}
            variableValues={variableValues}
            selectedOS={selectedOS}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}