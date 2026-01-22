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
import { Loader2, Save, ArrowLeft, LayoutTemplate, FolderOpen, Trash2, Send, Pencil, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { EmailTemplate, stripoEndpoints } from "@/lib/api";
import { SendEmailModal } from "./send-email-modal";

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
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([]);
  const [isLoadingSavedTemplates, setIsLoadingSavedTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("stripo");
  const [showSendModal, setShowSendModal] = useState(false);
  const [emailHtmlContent, setEmailHtmlContent] = useState("");

  // Rename template state
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameTemplateId, setRenameTemplateId] = useState<string>("");
  const [renameTemplateName, setRenameTemplateName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Flag to track if Stripo templates have been loaded
  const stripoTemplatesLoadedRef = useRef(false);

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

  // Load Stripo public templates ONCE when component mounts (pre-cache)
  useEffect(() => {
    const loadStripoTemplates = async () => {
      // Only load once
      if (stripoTemplatesLoadedRef.current) return;
      stripoTemplatesLoadedRef.current = true;

      setIsLoadingStripoTemplates(true);
      try {
        // Load FREE templates (max 100)
        const response = await stripoEndpoints.getPublicTemplates({ limit: 100 });
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

          // Map templates - Stripo uses templateId and logo fields
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const templates = rawTemplates.map((t: any) => ({
            id: (t.templateId || t.id || t.template_id) as number,
            name: (t.name || t.title || 'Sin nombre') as string,
            previewUrl: (t.logo || t.previewUrl || t.preview_url || t.preview) as string | undefined,
            thumbnailUrl: (t.logo || t.thumbnailUrl || t.thumbnail_url || t.thumbnail) as string | undefined,
          }));

          setStripoTemplates(templates);
        }
      } catch (error) {
        console.error("Error loading Stripo templates:", error);
        // Reset flag so it can retry on next mount
        stripoTemplatesLoadedRef.current = false;
      } finally {
        setIsLoadingStripoTemplates(false);
      }
    };

    // Pre-load Stripo templates when component mounts
    loadStripoTemplates();
  }, []);

  // Load saved templates from database when selector opens
  useEffect(() => {
    const loadSavedTemplates = async () => {
      if (showTemplateSelector) {
        setIsLoadingSavedTemplates(true);
        try {
          const response = await stripoEndpoints.listTemplates({});
          console.log("Saved templates response:", response);
          if (response.success && response.data) {
            setSavedTemplates(response.data);
          }
        } catch (error) {
          console.error("Error loading saved templates:", error);
        } finally {
          setIsLoadingSavedTemplates(false);
        }
      }
    };

    loadSavedTemplates();
  }, [showTemplateSelector]);

  const handleSelectStripoTemplate = async (template: StripoPublicTemplate) => {
    console.log("Selected template:", template);

    if (!template.id) {
      console.error("Template has no ID:", template);
      toast.error("Error: La plantilla no tiene ID válido");
      return;
    }

    setShowTemplateSelector(false);
    setCurrentTemplateId(undefined); // Reset - Stripo templates are not saved yet
    setTemplateName(""); // Clear name so user enters a new one
    setTemplateSubject(""); // Clear subject
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

  // Track if we've already loaded a template to prevent double loading
  const hasLoadedTemplateRef = useRef(false);

  // Reset ref on component mount/unmount
  useEffect(() => {
    // Reset ref on mount to ensure fresh state
    hasLoadedTemplateRef.current = false;
    return () => {
      hasLoadedTemplateRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadEditor = async () => {
      console.log("loadEditor - starting", {
        isLoadingStripoPublicTemplate,
        showTemplateSelector,
        isInitialized,
        hasLoaded: hasLoadedTemplateRef.current,
        hasContainer: !!containerRef.current,
        templateId
      });

      // Skip if we're loading a Stripo public template (will initialize from handleSelectStripoTemplate)
      if (isLoadingStripoPublicTemplate) {
        console.log("loadEditor - skipping, loading Stripo public template");
        return;
      }

      // Skip if template selector is open (user needs to select a template first)
      if (showTemplateSelector) {
        console.log("loadEditor - skipping, template selector is open");
        return;
      }

      // Skip if already initialized or already loaded a template
      if (!containerRef.current || isInitialized || hasLoadedTemplateRef.current) {
        console.log("loadEditor - skipping, already initialized or loaded", { isInitialized, hasLoaded: hasLoadedTemplateRef.current });
        return;
      }

      // If we have a valid templateId (not "undefined" string or empty), load the template from database first
      const isValidTemplateId = templateId && templateId !== "undefined" && templateId !== "null" && templateId.trim() !== "";
      console.log("loadEditor - proceeding to initialize", { templateId, isValidTemplateId });

      if (isValidTemplateId && !initialHtml) {
        setIsLoadingTemplate(true);
        hasLoadedTemplateRef.current = true;
        try {
          const response = await stripoEndpoints.getTemplate(templateId);
          if (!response.success || !response.data) {
            throw new Error("Error al cargar la plantilla");
          }
          const template = response.data;
          setTemplateName(template.name);
          setTemplateSubject(template.subject);
          setCurrentTemplateId(template.id);

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
          toast.error("Error al cargar la plantilla. La plantilla puede haber sido eliminada.");
          // Initialize empty editor on error and clear the invalid template ID
          setCurrentTemplateId(undefined);
          initializeEditor("stripo-editor-container", {});
        } finally {
          setIsLoadingTemplate(false);
        }
      } else {
        hasLoadedTemplateRef.current = true;
        // Initialize with provided HTML or empty
        initializeEditor("stripo-editor-container", {
          templateId,
          html: initialHtml,
          css: initialCss,
        });
      }
    };

    loadEditor();
  }, [initializeEditor, templateId, initialHtml, initialCss, isInitialized, isLoadingStripoPublicTemplate, showTemplateSelector]);

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

  // Handle open send modal
  const handleOpenSendModal = async () => {
    if (!isInitialized) {
      toast.error("El editor no está listo");
      return;
    }

    try {
      // Get compiled HTML using Stripo API
      if (!window.StripoEditorApi) {
        toast.error("Editor no disponible");
        return;
      }

      window.StripoEditorApi.actionsApi.compileEmail({
        callback: (error, html) => {
          if (error) {
            toast.error("Error al compilar el email");
            console.error("Compile error:", error);
            return;
          }
          setEmailHtmlContent(html);
          setShowSendModal(true);
        },
      });
    } catch (error) {
      console.error("Error preparing email:", error);
      toast.error("Error al preparar el email");
    }
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, templateId: string, templateName: string) => {
    e.stopPropagation(); // Prevent selecting the template when clicking delete

    if (!confirm(`¿Estás seguro de que deseas eliminar la plantilla "${templateName}"?`)) {
      return;
    }

    try {
      const response = await stripoEndpoints.deleteTemplate(templateId);
      if (response.success) {
        toast.success("Plantilla eliminada correctamente");
        // Remove from local state
        setSavedTemplates(prev => prev.filter(t => t.id !== templateId));
      } else {
        throw new Error(response.message || "Error al eliminar");
      }
    } catch {
      toast.error("Error al eliminar la plantilla");
    }
  };

  // Handle rename template
  const handleOpenRenameDialog = (e: React.MouseEvent, template: EmailTemplate) => {
    e.stopPropagation();
    setRenameTemplateId(template.id);
    setRenameTemplateName(template.name);
    setShowRenameDialog(true);
  };

  const handleRenameTemplate = async () => {
    if (!renameTemplateName.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    setIsRenaming(true);
    try {
      const response = await stripoEndpoints.updateTemplate(renameTemplateId, {
        name: renameTemplateName,
      });
      if (response.success) {
        toast.success("Plantilla renombrada correctamente");
        // Update local state
        setSavedTemplates(prev =>
          prev.map(t => (t.id === renameTemplateId ? { ...t, name: renameTemplateName } : t))
        );
        setShowRenameDialog(false);
      } else {
        throw new Error(response.message || "Error al renombrar");
      }
    } catch {
      toast.error("Error al renombrar la plantilla");
    } finally {
      setIsRenaming(false);
    }
  };

  // Handle duplicate template
  const handleDuplicateTemplate = async (e: React.MouseEvent, template: EmailTemplate) => {
    e.stopPropagation();

    try {
      // Fetch full template data
      const response = await stripoEndpoints.getTemplate(template.id);
      if (!response.success || !response.data) {
        throw new Error("Error al cargar la plantilla");
      }

      const fullTemplate = response.data;
      const designData = fullTemplate.designJson as { html?: string; css?: string } | undefined;

      // Create a new template with the same content using saveTemplate
      const createResponse = await stripoEndpoints.saveTemplate({
        name: `${fullTemplate.name} (Copia)`,
        subject: fullTemplate.subject,
        htmlContent: designData?.html || fullTemplate.htmlContent,
        designJson: fullTemplate.designJson,
        status: "draft",
        category: fullTemplate.category,
      });

      if (createResponse.success && createResponse.data) {
        toast.success("Plantilla duplicada correctamente");
        // Add to local state
        setSavedTemplates(prev => [createResponse.data!, ...prev]);
      } else {
        throw new Error(createResponse.message || "Error al duplicar");
      }
    } catch {
      toast.error("Error al duplicar la plantilla");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-x-hidden" style={{ maxWidth: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold">
              {currentTemplateId ? "Editar Plantilla" : "Crear Plantilla de Email"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Diseña tu email usando el editor visual
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleOpenSendModal}
            disabled={!isInitialized || isLoading || isLoadingTemplate}
            className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
          >
            <Send className="mr-2 h-4 w-4" />
            Enviar
          </Button>
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

      {/* Loading state - hide when template selector is open */}
      {(isLoading || isLoadingTemplate) && !showTemplateSelector && (
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
        className="flex-1 relative"
        style={{
          display: isLoading || isLoadingTemplate || error || showTemplateSelector ? "none" : "block",
          height: "calc(100vh - 70px)",
          marginTop: "10px",
          overflowX: "hidden",
          overflowY: "auto",
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
        <DialogContent className="!max-w-[95vw] w-full h-[90vh] flex flex-col p-6">
          <DialogHeader className="pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <LayoutTemplate className="h-6 w-6" />
              Selecciona una Plantilla
            </DialogTitle>
            <DialogDescription>
              Elige una plantilla prediseñada o usa una de tus plantillas guardadas
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="stripo" className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Plantillas de Stripo ({stripoTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Mis Plantillas ({savedTemplates.length})
              </TabsTrigger>
            </TabsList>

            {/* Stripo Templates Tab */}
            <TabsContent value="stripo" className="flex-1 overflow-y-auto min-h-0 pr-2 mt-0">
              {isLoadingStripoTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Cargando plantillas...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                  {/* Empty template option */}
                  <div
                    className="cursor-pointer hover:ring-2 hover:ring-primary rounded-xl transition-all group bg-muted/50 flex flex-col items-center justify-center p-4 min-h-[280px]"
                    onClick={() => {
                      setShowTemplateSelector(false);
                    }}
                  >
                    <div className="flex-1 flex items-center justify-center">
                      <LayoutTemplate className="h-20 w-20 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <p className="text-base font-medium text-center mt-3">Desde cero</p>
                  </div>

                  {/* Stripo public templates */}
                  {(Array.isArray(stripoTemplates) ? stripoTemplates : []).map((template) => (
                    <div
                      key={template.id}
                      className="cursor-pointer hover:ring-2 hover:ring-primary rounded-xl transition-all group overflow-hidden bg-white border shadow-sm hover:shadow-lg"
                      onClick={() => handleSelectStripoTemplate(template)}
                    >
                      <p className="text-sm font-semibold text-center py-3 px-3 border-b bg-gray-100 text-gray-900 line-clamp-1">{template.name || 'Sin nombre'}</p>
                      {template.thumbnailUrl || template.previewUrl ? (
                        <div className="w-full aspect-[3/4] overflow-hidden bg-gray-100">
                          <img
                            src={template.thumbnailUrl || template.previewUrl}
                            alt={template.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                          <LayoutTemplate className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Saved Templates Tab */}
            <TabsContent value="saved" className="flex-1 overflow-y-auto min-h-0 pr-2 mt-0">
              {isLoadingSavedTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Cargando plantillas guardadas...</span>
                </div>
              ) : savedTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No tienes plantillas guardadas</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crea una plantilla desde cero o selecciona una de Stripo y guárdala
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                  {savedTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="cursor-pointer hover:ring-2 hover:ring-primary rounded-xl transition-all group overflow-hidden bg-white border shadow-sm hover:shadow-lg"
                      onClick={async () => {
                        setShowTemplateSelector(false);
                        setIsLoadingTemplate(true);

                        try {
                          // Fetch full template data to ensure we have designJson
                          const response = await stripoEndpoints.getTemplate(template.id);
                          if (!response.success || !response.data) {
                            throw new Error("Error al cargar la plantilla");
                          }
                          const fullTemplate = response.data;

                          setCurrentTemplateId(fullTemplate.id);
                          setTemplateName(fullTemplate.name);
                          setTemplateSubject(fullTemplate.subject);

                          const designData = fullTemplate.designJson as { html?: string; css?: string } | undefined;
                          const html = designData?.html || fullTemplate.htmlContent;
                          const css = designData?.css || "";

                          console.log("Loading saved template - html length:", html?.length, "css length:", css?.length);

                          if (!html) {
                            throw new Error("La plantilla no tiene contenido HTML");
                          }

                          await resetAndReinitialize("stripo-editor-container", { html, css });
                          toast.success(`Plantilla "${fullTemplate.name}" cargada`);
                        } catch (error) {
                          console.error("Error loading saved template:", error);
                          toast.error("Error al cargar la plantilla");
                        } finally {
                          setIsLoadingTemplate(false);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between py-2 px-3 border-b bg-gray-100">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">{template.name}</p>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => handleOpenRenameDialog(e, template)}
                            className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Renombrar plantilla"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDuplicateTemplate(e, template)}
                            className="p-1 rounded hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors"
                            title="Duplicar plantilla"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteTemplate(e, template.id, template.name)}
                            className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar plantilla"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {template.thumbnailUrl ? (
                        <div className="w-full aspect-[3/4] overflow-hidden bg-gray-100">
                          <img
                            src={template.thumbnailUrl}
                            alt={template.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-[3/4] bg-muted flex flex-col items-center justify-center p-4">
                          <LayoutTemplate className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground text-center line-clamp-2">{template.subject}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Send Email Modal */}
      <SendEmailModal
        open={showSendModal}
        onOpenChange={setShowSendModal}
        htmlContent={emailHtmlContent}
        templateName={templateName}
        defaultSubject={templateSubject}
      />

      {/* Rename Template Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar Plantilla</DialogTitle>
            <DialogDescription>
              Ingresa un nuevo nombre para la plantilla
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rename-template">Nombre de la Plantilla</Label>
            <Input
              id="rename-template"
              placeholder="Nombre de la plantilla"
              value={renameTemplateName}
              onChange={(e) => setRenameTemplateName(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRenameTemplate} disabled={isRenaming}>
              {isRenaming ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="mr-2 h-4 w-4" />
              )}
              Renombrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
