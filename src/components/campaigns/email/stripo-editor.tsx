"use client";

import { useEffect, useRef, useState } from "react";
import { useStripoEditor } from "@/hooks/use-stripo-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Save, ArrowLeft, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { EmailTemplate, stripoEndpoints } from "@/lib/api";

interface StripoPublicTemplate {
  id: number;
  name: string;
  previewUrl?: string;
  thumbnailUrl?: string;
}

interface StripoEditorProps {
  templateId?: string;
  initialHtml?: string;
  initialCss?: string;
  onBack?: () => void;
  onSaved?: (template: EmailTemplate) => void;
}

export function StripoEditor({ templateId, initialHtml, initialCss, onBack, onSaved }: StripoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | undefined>(templateId);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(!templateId && !initialHtml);
  const [stripoTemplates, setStripoTemplates] = useState<StripoPublicTemplate[]>([]);
  const [isLoadingStripoTemplates, setIsLoadingStripoTemplates] = useState(false);
  const [isLoadingStripoPublicTemplate, setIsLoadingStripoPublicTemplate] = useState(false);

  const {
    isLoading,
    isInitialized,
    error,
    initializeEditor,
    resetAndReinitialize,
    saveTemplate,
    updateTemplate,
  } = useStripoEditor({
    onTemplateLoaded: () => {
      toast.success("Editor cargado correctamente");
    },
    onTemplateSaved: (template) => {
      toast.success("Plantilla guardada correctamente");
      setCurrentTemplateId(template.id);
      onSaved?.(template);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Load Stripo public templates when selector opens
  useEffect(() => {
    const loadStripoTemplates = async () => {
      if (showTemplateSelector && stripoTemplates.length === 0) {
        setIsLoadingStripoTemplates(true);
        try {
          const response = await stripoEndpoints.getPublicTemplates({ type: 'BASIC', limit: 20 });
          console.log("Stripo templates response:", response);
          if (response.success && response.data) {
            // Handle both array and object with templates key
            const rawTemplates = Array.isArray(response.data)
              ? response.data
              : ((response.data as unknown as { templates?: StripoPublicTemplate[] }).templates || []);

            // Log first template to see its structure
            if (rawTemplates.length > 0) {
              console.log("First template structure:", rawTemplates[0]);
            }

            // Map templates to ensure we have the right id field (Stripo might use templateId)
            const templates = rawTemplates.map((t: Record<string, unknown>) => ({
              id: (t.id || t.templateId || t.template_id) as number,
              name: (t.name || t.title || 'Sin nombre') as string,
              previewUrl: (t.previewUrl || t.preview_url || t.preview) as string | undefined,
              thumbnailUrl: (t.thumbnailUrl || t.thumbnail_url || t.thumbnail) as string | undefined,
            }));

            setStripoTemplates(templates);
          }
        } catch (error) {
          console.error("Error loading Stripo templates:", error);
        } finally {
          setIsLoadingStripoTemplates(false);
        }
      }
    };

    loadStripoTemplates();
  }, [showTemplateSelector, stripoTemplates.length]);

  const handleSelectStripoTemplate = async (template: StripoPublicTemplate) => {
    console.log("Selected template:", template);

    if (!template.id) {
      console.error("Template has no ID:", template);
      toast.error("Error: La plantilla no tiene ID válido");
      return;
    }

    setShowTemplateSelector(false);
    setIsLoadingTemplate(true);
    setIsLoadingStripoPublicTemplate(true); // Prevent loadEditor from running
    try {
      // Get the template detail (HTML and CSS) from Stripo API
      console.log("Fetching template detail for ID:", template.id);
      const response = await stripoEndpoints.getPublicTemplateDetail(template.id);
      console.log("Template detail response:", response);

      if (response.success && response.data) {
        // Stripo API might use different field names
        const templateData = response.data as Record<string, unknown>;
        console.log("Template data keys:", Object.keys(templateData));

        const html = (templateData.html || templateData.content || templateData.htmlContent || templateData.template) as string;
        const css = (templateData.css || templateData.styles || templateData.cssContent || "") as string;

        console.log("Extracted HTML length:", html?.length, "CSS length:", css?.length);

        if (!html) {
          console.error("No HTML found in template data:", templateData);
          throw new Error("La plantilla no contiene HTML");
        }

        // Use resetAndReinitialize to properly stop and restart the editor
        await resetAndReinitialize("stripo-editor-container", {
          html,
          css,
        });
        setIsLoadingStripoPublicTemplate(false); // Reset flag after successful load
        toast.success(`Plantilla "${template.name}" cargada`);
      } else {
        throw new Error("No se pudo obtener el detalle de la plantilla");
      }
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Error al cargar la plantilla");
      setIsLoadingStripoPublicTemplate(false); // Reset flag on error
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  useEffect(() => {
    const loadEditor = async () => {
      // Skip if we're loading a Stripo public template (will initialize from handleSelectStripoTemplate)
      if (isLoadingStripoPublicTemplate) {
        console.log("loadEditor - skipping, loading Stripo public template");
        return;
      }

      if (!containerRef.current || isInitialized) {
        return;
      }

      // If we have a valid templateId (not "undefined" string or empty), load the template from database first
      const isValidTemplateId = templateId && templateId !== "undefined" && templateId !== "null" && templateId.trim() !== "";
      console.log("loadEditor - templateId:", templateId, "isValidTemplateId:", isValidTemplateId);

      if (isValidTemplateId && !initialHtml) {
        setIsLoadingTemplate(true);
        try {
          const template = await stripoEndpoints.getTemplate(templateId);
          setTemplateName(template.name);
          setTemplateSubject(template.subject);

          // Get the HTML from designJson if available, otherwise use htmlContent
          const designData = template.designJson as { html?: string; css?: string } | undefined;
          const html = designData?.html || template.htmlContent;
          const css = designData?.css || "";

          initializeEditor("stripo-editor-container", {
            templateId,
            html,
            css,
          });
        } catch {
          toast.error("Error al cargar la plantilla");
          // Initialize empty editor on error
          initializeEditor("stripo-editor-container", {});
        } finally {
          setIsLoadingTemplate(false);
        }
      } else {
        // Initialize with provided HTML or empty
        initializeEditor("stripo-editor-container", {
          templateId,
          html: initialHtml,
          css: initialCss,
        });
      }
    };

    loadEditor();
  }, [initializeEditor, templateId, initialHtml, initialCss, isInitialized, isLoadingStripoPublicTemplate]);

  const handleSave = () => {
    if (currentTemplateId) {
      // Update existing template
      handleUpdateTemplate();
    } else {
      // Show dialog to enter name for new template
      setShowSaveDialog(true);
    }
  };

  const handleSaveNewTemplate = async () => {
    if (!templateName.trim() || !templateSubject.trim()) {
      toast.error("Por favor ingresa un nombre y asunto para la plantilla");
      return;
    }

    setIsSaving(true);
    try {
      const template = await saveTemplate(templateName, templateSubject, {
        status: "draft",
        category: "marketing",
      });
      setShowSaveDialog(false);
      setTemplateName("");
      setTemplateSubject("");
      onSaved?.(template);
    } catch {
      toast.error("Error al guardar la plantilla");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!currentTemplateId) return;

    setIsSaving(true);
    try {
      await updateTemplate(currentTemplateId, {
        name: templateName || undefined,
        subject: templateSubject || undefined,
      });
      toast.success("Plantilla actualizada correctamente");
    } catch {
      toast.error("Error al actualizar la plantilla");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          )}
          <div>
            <h1 className="text-xl font-semibold">
              {currentTemplateId ? "Editar Plantilla" : "Crear Plantilla de Email"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Diseña tu email usando el editor visual
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTemplateSelector(true)}
            disabled={isLoading || isLoadingTemplate}
          >
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Plantillas
          </Button>
          <Button onClick={handleSave} disabled={!isInitialized || isLoading || isSaving || isLoadingTemplate}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {currentTemplateId ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {(isLoading || isLoadingTemplate) && (
        <div className="flex items-center justify-center flex-1 bg-muted/50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              {isLoadingTemplate ? "Cargando plantilla..." : "Cargando editor..."}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-center flex-1 bg-muted/50">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error}</p>
              <Button
                className="mt-4"
                onClick={() =>
                  initializeEditor("stripo-editor-container", { templateId })
                }
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stripo Editor Container */}
      <div
        id="stripo-editor-container"
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{
          display: isLoading || isLoadingTemplate || error ? "none" : "block",
          minHeight: "600px",
        }}
      />

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar Plantilla</DialogTitle>
            <DialogDescription>
              Ingresa un nombre y asunto para tu plantilla de email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nombre de la Plantilla</Label>
              <Input
                id="template-name"
                placeholder="Ej: Newsletter Enero 2024"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-subject">Asunto del Email</Label>
              <Input
                id="template-subject"
                placeholder="Ej: ¡Descubre nuestras ofertas!"
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNewTemplate} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Selector Dialog */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              Selecciona una Plantilla
            </DialogTitle>
            <DialogDescription>
              Elige una plantilla prediseñada de Stripo para comenzar o inicia desde cero
            </DialogDescription>
          </DialogHeader>

          {isLoadingStripoTemplates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando plantillas...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
              {/* Empty template option */}
              <Card
                className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                onClick={() => {
                  setShowTemplateSelector(false);
                }}
              >
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-full aspect-[4/5] bg-muted rounded-md flex items-center justify-center mb-3 group-hover:bg-primary/10">
                    <LayoutTemplate className="h-12 w-12 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">Empezar desde cero</h3>
                </CardContent>
              </Card>

              {/* Stripo public templates */}
              {(Array.isArray(stripoTemplates) ? stripoTemplates : []).map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary hover:shadow-md transition-all group overflow-hidden"
                  onClick={() => handleSelectStripoTemplate(template)}
                >
                  <CardContent className="p-0">
                    {template.thumbnailUrl || template.previewUrl ? (
                      <div className="w-full aspect-[4/5] overflow-hidden bg-muted">
                        <img
                          src={template.thumbnailUrl || template.previewUrl}
                          alt={template.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-[4/5] bg-muted flex items-center justify-center">
                        <LayoutTemplate className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate">{template.name}</h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
