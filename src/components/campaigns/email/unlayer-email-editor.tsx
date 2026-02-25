"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Save,
  ArrowLeft,
  Monitor,
  Smartphone,
  Download,
  Eye,
  LayoutTemplate,
  FileText,
  Send,
  Users,
  Search,
  CheckCircle2,
  Plus,
  Mail,
  Pencil,
  Trash2,
  Check,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { EmailTemplate, stripoEndpoints, csvCampaignEndpoints } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CsvUploader, type ParsedRecipient, type CsvStats } from "@/components/campaigns/csv-uploader";
import { Skeleton } from "@/components/ui/skeleton";
import type { EditorRef, EmailEditorProps } from "react-email-editor";
import { predefinedUnlayerTemplates } from "./templates";
import { ProductFilterDropdowns, type ProductFilter } from "@/components/campaigns/product-filter-dropdowns";

const PREDEFINED_IDS = new Set(predefinedUnlayerTemplates.map((t) => t.id));

const EmailEditor = dynamic(() => import("react-email-editor"), {
  ssr: false,
});

interface Recipient {
  id: string;
  name: string;
  email: string;
}

interface UnlayerEmailEditorProps {
  templateId?: string;
  onBack?: () => void;
  onSaved?: (template: EmailTemplate) => void;
}

export function UnlayerEmailEditor({
  templateId,
  onBack,
  onSaved,
}: UnlayerEmailEditorProps) {
  const emailEditorRef = useRef<EditorRef>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [isLoading, setIsLoading] = useState(!!templateId);

  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [currentTemplateId, setCurrentTemplateId] = useState<string | undefined>(templateId);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [predefinedTemplates, setPredefinedTemplates] = useState<EmailTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<EmailTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState<"all" | "predefined" | "saved">("all");
  const [renamingTemplateId, setRenamingTemplateId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  // Estados para envío de emails
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [recipientSearch, setRecipientSearch] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [hasMoreRecipients, setHasMoreRecipients] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSendToAllConfirm, setShowSendToAllConfirm] = useState(false);
  const [isSendingToAll, setIsSendingToAll] = useState(false);
  const [sendToAllCount, setSendToAllCount] = useState<"all" | "extras_only" | number>("all");
  const [customSendCount, setCustomSendCount] = useState("");
  const [productFilter, setProductFilter] = useState<ProductFilter>({});
  const [showAddEmailsDialog, setShowAddEmailsDialog] = useState(false);
  const [extraEmailsText, setExtraEmailsText] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("campaign-extra-emails") || "";
    }
    return "";
  });
  const [extraEmails, setExtraEmails] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("campaign-extra-emails");
      if (saved) {
        return saved
          .split(/[\n,;]+/)
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      }
    }
    return [];
  });

  // Ref to hold pending template data to load once editor is ready
  const pendingDesignRef = useRef<any>(null);

  // Cargar templates: predefinidos (template + samsung) y guardados por usuario (marketing)
  const loadSavedTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      // Predefined Unlayer templates (local, always available)
      const unlayerPredefined: EmailTemplate[] = predefinedUnlayerTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        htmlContent: "",
        designJson: { templateType: "unlayer", design: t.design },
        category: t.category,
        createdAt: "",
        updatedAt: "",
      }));
      setPredefinedTemplates(unlayerPredefined);

      // User-saved templates from API
      const userResponse = await stripoEndpoints.listTemplates({ category: "marketing" });
      const user: EmailTemplate[] = [];
      if (userResponse.success && userResponse.data) {
        user.push(...userResponse.data);
      }
      setUserTemplates(user);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  const handleRenameTemplate = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      const response = await stripoEndpoints.updateTemplate(id, { name: newName.trim() });
      if (response.success) {
        setUserTemplates((prev) => prev.map((t) => t.id === id ? { ...t, name: newName.trim() } : t));
        toast.success("Nombre actualizado");
      } else {
        toast.error("Error al renombrar");
      }
    } catch {
      toast.error("Error al renombrar");
    }
    setRenamingTemplateId(null);
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const response = await stripoEndpoints.deleteTemplate(id);
      if (response.success) {
        setUserTemplates((prev) => prev.filter((t) => t.id !== id));
        if (currentTemplateId === id) {
          setCurrentTemplateId(undefined);
          setTemplateName("");
          setTemplateSubject("");
        }
        toast.success("Plantilla eliminada");
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error al eliminar");
    }
    setDeletingTemplateId(null);
  };

  // CSV campaign states
  const [sendMode, setSendMode] = useState<"database" | "csv">("database");
  const [csvRecipients, setCsvRecipients] = useState<ParsedRecipient[]>([]);
  const [csvStats, setCsvStats] = useState<CsvStats | null>(null);
  const [isSendingCsv, setIsSendingCsv] = useState(false);

  // Estado para carga de destinatarios
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const RECIPIENTS_PAGE_SIZE = 500;

  const mapEmailUsers = (users: any[]): Recipient[] =>
    users.map((user: any) => ({
      id: user.id,
      name: user.name || `${user.firstName || user.nombre || ""} ${user.lastName || user.apellido || ""}`.trim() || user.email,
      email: user.email,
    }));

  // Cargar destinatarios desde la base de datos
  const loadRecipients = useCallback(async (search?: string, filter?: ProductFilter) => {
    setIsLoadingRecipients(true);
    setRecipients([]);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/campaigns/recipients?limit=${RECIPIENTS_PAGE_SIZE}&offset=0${search ? `&search=${encodeURIComponent(search)}` : ""}`;
      if (filter?.categoria) url += `&categoria=${encodeURIComponent(filter.categoria)}`;
      if (filter?.subcategoria) url += `&subcategoria=${encodeURIComponent(filter.subcategoria)}`;
      if (filter?.submenu) url += `&submenu=${encodeURIComponent(filter.submenu)}`;
      if (filter?.modelo?.length) filter.modelo.forEach(m => url += `&modelo=${encodeURIComponent(m)}`);
      const response = await fetch(url, {
          headers: {
            "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const recipientsList = mapEmailUsers(data.users || []);
        setRecipients(recipientsList);
        setRecipientsTotal(data.total || recipientsList.length);
        setHasMoreRecipients(recipientsList.length < (data.total || 0));
      } else {
        console.error("Error loading recipients:", response.statusText);
        toast.error("Error al cargar destinatarios");
      }
    } catch (error) {
      console.error("Error loading recipients:", error);
      toast.error("Error al cargar destinatarios");
    } finally {
      setIsLoadingRecipients(false);
    }
  }, []);

  const loadMoreRecipients = useCallback(async () => {
    setIsLoadingMore(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/campaigns/recipients?limit=${RECIPIENTS_PAGE_SIZE}&offset=${recipients.length}${recipientSearch ? `&search=${encodeURIComponent(recipientSearch)}` : ""}`;
      if (productFilter?.categoria) url += `&categoria=${encodeURIComponent(productFilter.categoria)}`;
      if (productFilter?.subcategoria) url += `&subcategoria=${encodeURIComponent(productFilter.subcategoria)}`;
      if (productFilter?.submenu) url += `&submenu=${encodeURIComponent(productFilter.submenu)}`;
      if (productFilter?.modelo?.length) productFilter.modelo.forEach(m => url += `&modelo=${encodeURIComponent(m)}`);
      const response = await fetch(url, {
          headers: {
            "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const newUsers = mapEmailUsers(data.users || []);
        setRecipients(prev => [...prev, ...newUsers]);
        setHasMoreRecipients(recipients.length + newUsers.length < (data.total || 0));
      }
    } catch (error) {
      console.error("Error loading more recipients:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [recipients.length, recipientSearch, productFilter]);

  // Infinite scroll
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!sentinel || !scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRecipients && !isLoadingMore && !isLoadingRecipients) {
          loadMoreRecipients();
        }
      },
      { root: scrollContainer, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreRecipients, isLoadingMore, isLoadingRecipients, loadMoreRecipients]);

  const filteredRecipients = recipients;

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllRecipients = () => {
    const allIds = filteredRecipients.map((r) => r.id);
    setSelectedRecipients(new Set(allIds));
  };

  const deselectAllRecipients = () => {
    setSelectedRecipients(new Set());
  };

  // Helper: export HTML from Unlayer (Promise-based)
  const exportHtmlAsync = (): Promise<{ html: string; design: any }> => {
    return new Promise((resolve, reject) => {
      const editor = emailEditorRef.current?.editor;
      if (!editor) {
        reject(new Error("Editor not ready"));
        return;
      }
      editor.exportHtml((data: { html: string; design: any }) => {
        resolve({ html: data.html, design: data.design });
      });
    });
  };

  // Helper: save design from Unlayer (Promise-based)
  const saveDesignAsync = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      const editor = emailEditorRef.current?.editor;
      if (!editor) {
        reject(new Error("Editor not ready"));
        return;
      }
      editor.saveDesign((design: any) => {
        resolve(design);
      });
    });
  };

  // Enviar emails a seleccionados
  const handleSendEmails = async () => {
    if (selectedRecipients.size === 0) {
      toast.error("Selecciona al menos un destinatario");
      return;
    }

    if (!emailSubject.trim()) {
      toast.error("Ingresa un asunto para el email");
      return;
    }

    setIsSending(true);

    try {
      const { html, design } = await exportHtmlAsync();
      const selectedEmails = recipients
        .filter((r) => selectedRecipients.has(r.id))
        .map((r) => ({ email: r.email, name: r.name }));

      const response = await csvCampaignEndpoints.sendEmails({
        subject: emailSubject,
        html,
        recipients: selectedEmails,
        audit: {
          csvFilename: "seleccion-manual",
          csvTotalRows: selectedEmails.length,
          csvValidRows: selectedEmails.length,
          csvInvalidRows: 0,
          csvDuplicateRows: 0,
        },
        campaignName: campaignName.trim() || undefined,
        designJson: design ? { templateType: "unlayer", design } : undefined,
        templateId: currentTemplateId && !isPredefinedTemplate ? currentTemplateId : undefined,
        templateName: templateName || undefined,
      });

      if (response.success && response.data) {
        const total = response.data.totalRecipients;
        toast.success(`Envío iniciado para ${total} destinatario(s)`);
        setShowSendDialog(false);
        setSelectedRecipients(new Set());
        setEmailSubject("");
      } else {
        toast.error(response.message || "Error al enviar los emails");
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error("Error al enviar los emails");
    } finally {
      setIsSending(false);
    }
  };

  // Enviar a TODOS los destinatarios (backend procesa en background)
  const handleSendToAll = async () => {
    if (!emailSubject.trim()) {
      toast.error("Ingresa un asunto para el email");
      return;
    }

    setIsSendingToAll(true);
    try {
      const { html, design } = await exportHtmlAsync();
      const isExtrasOnly = sendToAllCount === "extras_only";
      const campaignMeta = {
        campaignName: campaignName.trim() || undefined,
        designJson: design ? { templateType: "unlayer", design } : undefined,
        templateId: currentTemplateId && !isPredefinedTemplate ? currentTemplateId : undefined,
        templateName: templateName || undefined,
      };

      if (isExtrasOnly) {
        // Solo enviar a correos adicionales - usar CSV endpoint para no tocar la BD de usuarios
        const response = await csvCampaignEndpoints.sendEmails({
          subject: emailSubject,
          html,
          recipients: extraEmails.map((email) => ({
            email,
            name: email.split("@")[0] || email,
          })),
          audit: {
            csvFilename: "extras-manuales",
            csvTotalRows: extraEmails.length,
            csvValidRows: extraEmails.length,
            csvInvalidRows: 0,
            csvDuplicateRows: 0,
          },
          ...campaignMeta,
        });

        if (response.success && response.data) {
          toast.success(`Envío iniciado para ${extraEmails.length} correos adicionales.`);
          setShowSendToAllConfirm(false);
          setShowSendDialog(false);
          setEmailSubject("");
        } else {
          toast.error(response.message || "Error al iniciar el envío");
        }
      } else {
        const maxRecipients = sendToAllCount === "all" ? undefined : sendToAllCount as number;
        const activeFilter = productFilter?.categoria ? productFilter : undefined;
        const response = await stripoEndpoints.sendToAll({
          subject: emailSubject,
          html,
          maxRecipients,
          productFilter: activeFilter,
          extraEmails: extraEmails.length > 0 ? extraEmails : undefined,
          ...campaignMeta,
        });

        if (response.success && response.data) {
          const { estimatedTotal } = response.data;
          const extraCount = extraEmails.length;
          const totalWithExtra = (estimatedTotal || 0) + extraCount;
          const secs = Math.ceil(totalWithExtra / 12);
          const timeStr = secs < 60 ? `${secs}s` : secs < 3600 ? `${Math.ceil(secs / 60)} min` : `${Math.floor(secs / 3600)}h ${Math.ceil((secs % 3600) / 60)}min`;
          toast.success(
            `Envío iniciado para ${totalWithExtra.toLocaleString()} destinatarios${extraCount > 0 ? ` (incluye ${extraCount} correos adicionales)` : ""}. Tiempo estimado: ~${timeStr}.`
          );
          setShowSendToAllConfirm(false);
          setShowSendDialog(false);
          setEmailSubject("");
          setExtraEmails([]);
          setExtraEmailsText("");
          localStorage.removeItem("campaign-extra-emails");
        } else {
          toast.error(response.message || "Error al iniciar el envío de emails");
        }
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error("Error al enviar los emails");
    } finally {
      setIsSendingToAll(false);
    }
  };

  // Enviar emails a destinatarios CSV
  const handleSendCsvEmails = async () => {
    if (csvRecipients.length === 0) {
      toast.error("No hay destinatarios válidos en el CSV");
      return;
    }
    if (!emailSubject.trim()) {
      toast.error("Ingresa un asunto para el email");
      return;
    }

    setIsSendingCsv(true);
    try {
      const { html, design } = await exportHtmlAsync();
      const response = await csvCampaignEndpoints.sendEmails({
        subject: emailSubject,
        html,
        recipients: csvRecipients.map((r) => ({
          email: r.email!,
          name: r.name,
        })),
        audit: {
          csvFilename: csvStats?.filename || "unknown.csv",
          csvTotalRows: csvStats?.totalRows || 0,
          csvValidRows: csvStats?.validRows || 0,
          csvInvalidRows: csvStats?.invalidRows || 0,
          csvDuplicateRows: csvStats?.duplicateRows || 0,
        },
        campaignName: campaignName.trim() || undefined,
        designJson: design ? { templateType: "unlayer", design } : undefined,
        templateId: currentTemplateId && !isPredefinedTemplate ? currentTemplateId : undefined,
        templateName: templateName || undefined,
      });

      if (response.success && response.data) {
        const total = response.data.totalRecipients;
        const secs = Math.ceil(total / 12);
        const timeStr = secs < 60 ? `${secs}s` : secs < 3600 ? `${Math.ceil(secs / 60)} min` : `${Math.floor(secs / 3600)}h ${Math.ceil((secs % 3600) / 60)}min`;
        toast.success(
          `Envío CSV iniciado para ${total.toLocaleString()} destinatarios. Tiempo estimado: ~${timeStr}.`
        );
        setShowSendDialog(false);
        setEmailSubject("");
        setCsvRecipients([]);
        setCsvStats(null);
        setSendMode("database");
      } else {
        toast.error(response.message || "Error al iniciar el envío CSV");
      }
    } catch (error) {
      console.error("Error sending CSV campaign emails:", error);
      toast.error("Error al enviar los emails del CSV");
    } finally {
      setIsSendingCsv(false);
    }
  };

  // Aplicar template seleccionado al editor
  const applyTemplate = useCallback((template: EmailTemplate) => {
    const editor = emailEditorRef.current?.editor;
    if (!editor) return;

    const designJson = template.designJson as {
      templateType?: string;
      design?: any;
      grapesJSData?: { html: string; css: string; components?: string; styles?: string };
    } | undefined;

    if (designJson?.templateType === "unlayer" && designJson.design) {
      editor.loadDesign(designJson.design);
    } else if (template.htmlContent) {
      // Legacy GrapesJS or raw HTML templates: load as blank and warn
      editor.loadBlank();
      toast.info("Este template fue creado con un editor anterior. Se cargará como plantilla base.");
    }

    setCurrentTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateSubject(template.subject);
    if (!campaignName.trim()) {
      setCampaignName(template.name);
    }

    setShowTemplatesDialog(false);
    toast.success(`Template "${template.name}" aplicado`);
  }, []);

  // Editor ready callback
  const onEditorReady = useCallback(async () => {
    setEditorReady(true);
    const editor = emailEditorRef.current?.editor;
    if (!editor) return;

    // Load existing template if templateId is provided
    if (templateId && templateId !== "undefined") {
      setIsLoading(true);
      try {
        const response = await stripoEndpoints.getTemplate(templateId);
        if (response.success && response.data) {
          const template = response.data;
          setTemplateName(template.name);
          setTemplateSubject(template.subject);
          setCurrentTemplateId(template.id);
          if (!campaignName.trim()) {
            setCampaignName(template.name);
          }

          const designJson = template.designJson as {
            templateType?: string;
            design?: any;
            grapesJSData?: { html: string; css: string; components?: string; styles?: string };
          } | undefined;

          if (designJson?.templateType === "unlayer" && designJson.design) {
            editor.loadDesign(designJson.design);
          } else if (template.htmlContent) {
            // Legacy template — can't load GrapesJS design into Unlayer
            toast.info("Este template fue creado con un editor anterior. Puedes editarlo como nueva plantilla.");
          }
        }
      } catch {
        toast.error("Error al cargar la plantilla");
      } finally {
        setIsLoading(false);
      }
    }

    // Load pending design if set by applyTemplate before editor was ready
    if (pendingDesignRef.current) {
      editor.loadDesign(pendingDesignRef.current);
      pendingDesignRef.current = null;
    }
  }, [templateId]);

  const isPredefinedTemplate = currentTemplateId ? PREDEFINED_IDS.has(currentTemplateId) : false;

  const handleSave = () => {
    if (currentTemplateId && !isPredefinedTemplate) {
      handleUpdateTemplate();
    } else {
      // No template or predefined template → save as new
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
      const { html, design } = await exportHtmlAsync();

      const saveResponse = await stripoEndpoints.saveTemplate({
        name: templateName,
        subject: templateSubject,
        htmlContent: html,
        designJson: {
          templateType: "unlayer",
          design,
        },
        category: "marketing",
        status: "draft",
      });

      if (!saveResponse.success || !saveResponse.data) {
        throw new Error(saveResponse.message || "Error al guardar template");
      }

      toast.success("Plantilla guardada correctamente");
      setShowSaveDialog(false);
      setCurrentTemplateId(saveResponse.data.id);
      onSaved?.(saveResponse.data);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Error al guardar la plantilla");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!currentTemplateId) return;

    setIsSaving(true);
    try {
      const { html, design } = await exportHtmlAsync();

      const updateResponse = await stripoEndpoints.updateTemplate(currentTemplateId, {
        name: templateName || undefined,
        subject: templateSubject || undefined,
        htmlContent: html,
        designJson: {
          templateType: "unlayer",
          design,
        },
      });

      if (!updateResponse.success || !updateResponse.data) {
        throw new Error(updateResponse.message || "Error al actualizar template");
      }

      toast.success("Plantilla actualizada correctamente");
      onSaved?.(updateResponse.data);
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Error al actualizar la plantilla");
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    try {
      const { html } = await exportHtmlAsync();
      setPreviewHtml(html);
      setShowPreviewDialog(true);
    } catch {
      toast.error("Error al generar preview");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background z-50 relative">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                {currentTemplateId && !isPredefinedTemplate ? "Editar Plantilla" : "Crear Plantilla"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Editor de email drag-and-drop
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">
                Nombre de la Campaña
              </label>
              <Input
                placeholder="Ej: Galaxy Unpacked Febrero 2026"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-[280px] h-7 text-sm border-dashed"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              loadSavedTemplates();
              setShowTemplatesDialog(true);
            }}
            disabled={!editorReady || isLoading}
          >
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Usar Template
          </Button>
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!editorReady || isLoading}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={!editorReady || isLoading || isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>
          <Button
            onClick={async () => {
              // Auto-save before opening send dialog (only for DB templates)
              if (currentTemplateId && !isPredefinedTemplate) {
                try {
                  await handleUpdateTemplate();
                } catch {
                  // handleUpdateTemplate already shows error toast
                  return;
                }
              } else if (isPredefinedTemplate) {
                toast.info("Guarda la plantilla primero para poder enviar.");
                setShowSaveDialog(true);
                return;
              }
              // Pre-fill subject from template
              if (!emailSubject.trim() && templateSubject.trim()) {
                setEmailSubject(templateSubject);
              }
              loadRecipients(undefined, productFilter);
              setShowSendDialog(true);
            }}
            disabled={!editorReady || isLoading || isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 130px)" }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Cargando plantilla...</p>
            </div>
          </div>
        )}
        <EmailEditor
          ref={emailEditorRef}
          onReady={onEditorReady}
          locale="es-ES"
          minHeight="calc(100vh - 130px)"
          options={{
            displayMode: "email",
            locale: "es-ES",
            appearance: {
              theme: "modern_light",
            },
            features: {
              stockImages: {
                enabled: true,
                safeSearch: true,
              },
            },
          }}
        />
      </div>

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

      {/* Preview Dialog - Gmail style */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="!max-w-4xl h-[90vh] p-0 gap-0 overflow-hidden !border-zinc-700">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-zinc-900">
            <DialogTitle className="text-sm font-medium text-zinc-200">Vista Previa del Email</DialogTitle>
            <div className="flex items-center gap-2 mr-6">
              {/* Device toggle */}
              <div className="flex items-center gap-1">
                <Button
                  variant={previewMode === "desktop" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                  className={`h-7 px-2 text-xs gap-1 ${previewMode !== "desktop" ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : ""}`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Desktop
                </Button>
                <Button
                  variant={previewMode === "mobile" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                  className={`h-7 px-2 text-xs gap-1 ${previewMode !== "mobile" ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : ""}`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Móvil
                </Button>
              </div>

              {/* Separator */}
              <div className="w-px h-5 bg-zinc-700" />

              {/* Theme toggle */}
              <div className="flex items-center gap-1">
                <Button
                  variant={previewTheme === "light" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewTheme("light")}
                  className={`h-7 px-2 text-xs gap-1 ${previewTheme !== "light" ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : ""}`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  Día
                </Button>
                <Button
                  variant={previewTheme === "dark" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewTheme("dark")}
                  className={`h-7 px-2 text-xs gap-1 ${previewTheme !== "dark" ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : ""}`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  Noche
                </Button>
              </div>
            </div>
          </div>

          {/* Gmail-like email view */}
          <div className={`flex-1 overflow-auto ${previewTheme === "dark" ? "bg-zinc-950" : "bg-[#f6f8fc]"}`}>
            <div className={`mx-auto transition-all ${previewMode === "mobile" ? "max-w-[375px]" : "max-w-[700px]"}`}>
              {/* Email header - Gmail style */}
              <div className={`border-b px-6 py-4 mt-0 ${previewTheme === "dark" ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200"}`}>
                {/* Subject */}
                <h2 className={`text-lg font-normal mb-3 ${previewTheme === "dark" ? "text-zinc-100" : "text-gray-900"}`}>
                  {templateSubject || emailSubject || "Sin asunto"}
                </h2>
                {/* Sender info */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    SS
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${previewTheme === "dark" ? "text-zinc-100" : "text-gray-900"}`}>Samsung Store</span>
                      <span className={`text-xs ${previewTheme === "dark" ? "text-zinc-500" : "text-gray-500"}`}>&lt;no-reply@imagiq.com&gt;</span>
                    </div>
                    <div className={`text-xs mt-0.5 ${previewTheme === "dark" ? "text-zinc-500" : "text-gray-500"}`}>
                      para mí
                    </div>
                  </div>
                  <span className={`text-xs flex-shrink-0 ${previewTheme === "dark" ? "text-zinc-500" : "text-gray-500"}`}>
                    {new Date().toLocaleString("es-CO", { hour: "numeric", minute: "2-digit", hour12: true })}
                  </span>
                </div>
              </div>

              {/* Email body */}
              <div className={previewTheme === "dark" ? "bg-zinc-900" : "bg-white"}>
                <iframe
                  srcDoc={previewTheme === "dark"
                    ? `<html><head><style>body{background:#18181b;color-scheme:dark;}</style></head><body>${previewHtml.replace(/<html[^>]*>|<\/html>/gi, '').replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '').replace(/<body[^>]*>/, '').replace(/<\/body>/, '')}</body></html>`
                    : previewHtml
                  }
                  className="w-full border-0"
                  style={{ minHeight: "600px", height: "calc(90vh - 200px)" }}
                  title="Email Preview"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplatesDialog} onOpenChange={(open) => {
        setShowTemplatesDialog(open);
        if (!open) {
          setTemplateSearch("");
          setTemplateFilter("all");
        }
      }}>
        <DialogContent className="!max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Seleccionar Template</DialogTitle>
            <DialogDescription>
              Elige un template predefinido o uno de tus templates guardados
            </DialogDescription>
          </DialogHeader>
          {/* Filtros de categoría */}
          <div className="flex items-center gap-2 border-b pb-3">
            <Button
              variant={templateFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTemplateFilter("all")}
              className="gap-2"
            >
              Todos
              <Badge variant="secondary" className={templateFilter === "all" ? "bg-primary-foreground/20" : ""}>
                {predefinedTemplates.length + userTemplates.length}
              </Badge>
            </Button>
            <Button
              variant={templateFilter === "predefined" ? "default" : "outline"}
              size="sm"
              onClick={() => setTemplateFilter("predefined")}
              className="gap-2"
            >
              <LayoutTemplate className="h-4 w-4" />
              Predefinidos
              <Badge variant="secondary" className={templateFilter === "predefined" ? "bg-primary-foreground/20" : ""}>
                {predefinedTemplates.length}
              </Badge>
            </Button>
            <Button
              variant={templateFilter === "saved" ? "default" : "outline"}
              size="sm"
              onClick={() => setTemplateFilter("saved")}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Mis Guardados
              <Badge variant="secondary" className={templateFilter === "saved" ? "bg-primary-foreground/20" : ""}>
                {userTemplates.length}
              </Badge>
            </Button>
          </div>
          {/* Buscador de templates */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar template por nombre..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="flex-1 h-[calc(80vh-240px)]">
            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (() => {
              const searchTerm = templateSearch.toLowerCase().trim();

              const showPredefined = templateFilter === "all" || templateFilter === "predefined";
              const showUser = templateFilter === "all" || templateFilter === "saved";

              const filteredPredefined = showPredefined
                ? (searchTerm
                    ? predefinedTemplates.filter(t =>
                        t.name.toLowerCase().includes(searchTerm) ||
                        t.subject.toLowerCase().includes(searchTerm)
                      )
                    : predefinedTemplates)
                : [];
              const filteredUser = showUser
                ? (searchTerm
                    ? userTemplates.filter(t =>
                        t.name.toLowerCase().includes(searchTerm) ||
                        t.subject.toLowerCase().includes(searchTerm)
                      )
                    : userTemplates)
                : [];

              if (predefinedTemplates.length === 0 && userTemplates.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No hay templates disponibles</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Guarda tu primer template para verlo aquí
                    </p>
                  </div>
                );
              }

              if (filteredPredefined.length === 0 && filteredUser.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No se encontraron templates</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchTerm
                        ? `No hay templates que coincidan con "${templateSearch}"`
                        : templateFilter === "saved"
                          ? "Aún no tienes templates guardados"
                          : "No hay templates predefinidos disponibles"
                      }
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-6 p-4">
                  {/* Sección: Templates Predefinidos */}
                  {filteredPredefined.length > 0 && (
                    <div>
                      {templateFilter === "all" && (
                        <div className="flex items-center gap-2 mb-3">
                          <LayoutTemplate className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">Templates Predefinidos</h3>
                          <Badge variant="secondary">{filteredPredefined.length}</Badge>
                        </div>
                      )}
                      <div className="space-y-2">
                        {filteredPredefined.map((template) => (
                          <div
                            key={template.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => applyTemplate(template)}
                          >
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{template.name}</h4>
                              <p className="text-xs text-muted-foreground truncate">
                                {template.subject}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" className="flex-shrink-0">
                              Usar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Separador si hay ambos tipos */}
                  {templateFilter === "all" && filteredPredefined.length > 0 && filteredUser.length > 0 && (
                    <div className="border-t pt-6" />
                  )}

                  {/* Sección: Mis Templates Guardados */}
                  {filteredUser.length > 0 && (
                    <div>
                      {templateFilter === "all" && (
                        <div className="flex items-center gap-2 mb-3">
                          <Save className="h-5 w-5 text-green-600" />
                          <h3 className="text-lg font-semibold">Mis Templates Guardados</h3>
                          <Badge variant="outline" className="border-green-600 text-green-600">{filteredUser.length}</Badge>
                        </div>
                      )}
                      <div className="space-y-2">
                        {filteredUser.map((template) => (
                          <div
                            key={template.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                          >
                            <div className="h-10 w-10 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => applyTemplate(template)}>
                              {renamingTemplateId === template.id ? (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Input
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleRenameTemplate(template.id, renameValue);
                                      if (e.key === "Escape") setRenamingTemplateId(null);
                                    }}
                                    className="h-7 text-sm"
                                    autoFocus
                                  />
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleRenameTemplate(template.id, renameValue)}>
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRenamingTemplateId(null)}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <h4 className="font-medium text-sm truncate">{template.name}</h4>
                                  <p className="text-xs text-muted-foreground truncate">{template.subject}</p>
                                </>
                              )}
                            </div>
                            {deletingTemplateId === template.id ? (
                              <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <span className="text-xs text-destructive mr-1">Eliminar?</span>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTemplate(template.id)}>
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDeletingTemplateId(null)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : renamingTemplateId !== template.id ? (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={(e) => { e.stopPropagation(); setRenamingTemplateId(template.id); setRenameValue(template.name); setDeletingTemplateId(null); }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); setDeletingTemplateId(template.id); setRenamingTemplateId(null); }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="outline" className="flex-shrink-0 border-green-600 text-green-600 hover:bg-green-600 hover:text-white" onClick={() => applyTemplate(template)}>
                                  Usar
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="!max-w-4xl h-[95vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Enviar Email
            </DialogTitle>
            <DialogDescription>
              Selecciona los destinatarios y configura el envío de tu email
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Info de la plantilla a enviar */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <LayoutTemplate className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase font-medium">Campaña</p>
                <p className="font-medium truncate">
                  {campaignName || templateName || "Sin nombre"}
                </p>
              </div>
              {templateSubject && (
                <Badge variant="outline" className="flex-shrink-0">
                  {templateSubject.length > 30 ? templateSubject.substring(0, 30) + "..." : templateSubject}
                </Badge>
              )}
            </div>

            {/* Asunto del email (obligatorio) */}
            <div className="space-y-1.5">
              <Label htmlFor="email-subject" className="text-sm font-medium">
                Asunto del Email <span className="text-green-600">*</span>
              </Label>
              <Input
                id="email-subject"
                placeholder="Ej: ¡Oferta especial para ti!"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className={!emailSubject.trim() ? "border-green-300 focus-visible:ring-green-400" : "border-green-200 focus-visible:ring-green-400"}
              />
              {!emailSubject.trim() && (
                <p className="text-xs text-green-600">El asunto es obligatorio para enviar emails</p>
              )}
            </div>

            {/* Tabs: Base de datos vs Cargar CSV */}
            <Tabs value={sendMode} onValueChange={(v) => setSendMode(v as "database" | "csv")} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="database" className="gap-1.5">
                  <Users className="h-4 w-4" />
                  Base de datos
                </TabsTrigger>
                <TabsTrigger value="csv" className="gap-1.5">
                  <FileText className="h-4 w-4" />
                  Cargar CSV
                </TabsTrigger>
              </TabsList>

              <TabsContent value="database" className="flex-1 overflow-hidden flex flex-col space-y-4 mt-4">
                {/* Total de destinatarios + Agregar emails + Enviar a todos */}
                {(recipientsTotal > 0 || isLoadingRecipients) && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                    <div className="h-10 w-10 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      {isLoadingRecipients ? (
                        <Skeleton className="h-7 w-40 bg-green-200/50" />
                      ) : (
                        <p className="font-bold text-lg text-green-600">
                          {(recipientsTotal + extraEmails.length).toLocaleString()} destinatarios
                          {extraEmails.length > 0 && (
                            <span className="text-sm font-normal ml-1">
                              ({recipientsTotal.toLocaleString()} + {extraEmails.length} extra)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddEmailsDialog(true)}
                      className="gap-1 border-green-300 text-green-700 hover:bg-green-100 dark:hover:bg-green-900"
                    >
                      <Plus className="h-4 w-4" />
                      {extraEmails.length > 0 ? `${extraEmails.length} extra` : "Agregar"}
                    </Button>
                    <Button
                      onClick={() => setShowSendToAllConfirm(true)}
                      disabled={isSendingToAll || !emailSubject.trim()}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4" />
                      Enviar a todos
                    </Button>
                  </div>
                )}

                {/* Filtro de segmentación por producto */}
                <ProductFilterDropdowns
                  value={productFilter}
                  onChange={(filter) => {
                    setProductFilter(filter);
                    loadRecipients(recipientSearch, filter);
                  }}
                />

                {/* Buscador y controles */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o email..."
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          loadRecipients(recipientSearch, productFilter);
                        }
                      }}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadRecipients(recipientSearch, productFilter)}
                    disabled={isLoadingRecipients}
                  >
                    {isLoadingRecipients ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectAllRecipients}>
                    Seleccionar cargados
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllRecipients}>
                    Limpiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const csvContent = [
                        ["Nombre", "Email"].join(","),
                        ...recipients.map(r => [`"${r.name.replace(/"/g, '""')}"`, `"${r.email}"`].join(","))
                      ].join("\n");
                      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `destinatarios-email-${new Date().toISOString().split("T")[0]}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success(`${recipients.length} correos exportados a CSV`);
                    }}
                    disabled={recipients.length === 0}
                    className="gap-1"
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                </div>

                {/* Contador de seleccionados */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedRecipients.size} seleccionados · Mostrando {recipients.length} de {recipientsTotal.toLocaleString()} destinatarios
                  </span>
                  {selectedRecipients.size > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {selectedRecipients.size} seleccionados
                    </Badge>
                  )}
                </div>

                {/* Lista de destinatarios */}
                <div ref={scrollContainerRef} className="flex-1 border rounded-lg h-[350px] overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {isLoadingRecipients ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Cargando destinatarios...</span>
                      </div>
                    ) : filteredRecipients.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {recipients.length === 0
                          ? "Haz clic en 'Buscar' para cargar destinatarios"
                          : "No se encontraron destinatarios"}
                      </div>
                    ) : (
                      <>
                        {filteredRecipients.map((recipient) => (
                          <div
                            key={recipient.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedRecipients.has(recipient.id)
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-muted"
                            }`}
                            onClick={() => toggleRecipient(recipient.id)}
                          >
                            <Checkbox
                              checked={selectedRecipients.has(recipient.id)}
                              onCheckedChange={() => toggleRecipient(recipient.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{recipient.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {recipient.email}
                              </p>
                            </div>
                          </div>
                        ))}
                        {hasMoreRecipients && (
                          <div ref={loadMoreSentinelRef} className="flex items-center justify-center py-4">
                            {isLoadingMore ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-xs text-muted-foreground">Cargando más...</span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">Scroll para cargar más</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="csv" className="flex-1 overflow-hidden flex flex-col space-y-4 mt-4">
                <CsvUploader
                  mode="email"
                  onRecipientsReady={setCsvRecipients}
                  onStatsChange={setCsvStats}
                />
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowSendDialog(false);
                setSelectedRecipients(new Set());
                setEmailSubject("");
                setExtraEmails([]);
                setExtraEmailsText("");
                setCsvRecipients([]);
                setCsvStats(null);
                setSendMode("database");
              }}
            >
              Cancelar
            </Button>
            {sendMode === "database" ? (
              <Button
                onClick={handleSendEmails}
                disabled={isSending || selectedRecipients.size === 0 || !emailSubject.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar a {selectedRecipients.size} destinatario(s)
              </Button>
            ) : (
              <Button
                onClick={handleSendCsvEmails}
                disabled={isSendingCsv || csvRecipients.length === 0 || !emailSubject.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSendingCsv ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar CSV ({csvRecipients.length.toLocaleString()})
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para enviar a todos */}
      <Dialog open={showSendToAllConfirm} onOpenChange={(open) => {
        setShowSendToAllConfirm(open);
        if (!open) { setSendToAllCount("all"); setCustomSendCount(""); }
      }}>
        <DialogContent className="max-w-lg !z-[10001]" overlayClassName="!z-[10000]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Users className="h-5 w-5" />
              Enviar email masivo
            </DialogTitle>
            <DialogDescription>
              Selecciona cuántos destinatarios quieres alcanzar.
              El envío se procesará en lotes en el servidor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {/* Selector de cantidad */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cantidad de destinatarios</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "all" as const, label: `Todos (${recipientsTotal.toLocaleString()})` },
                  ...(extraEmails.length > 0 ? [{ value: "extras_only" as const, label: `Solo adicionales (${extraEmails.length})` }] : []),
                  { value: 500, label: "500" },
                  { value: 1000, label: "1.000" },
                  { value: 5000, label: "5.000" },
                ] as Array<{ value: "all" | "extras_only" | number; label: string }>).map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => { setSendToAllCount(opt.value); setCustomSendCount(""); }}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      sendToAllCount === opt.value
                        ? "border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-medium"
                        : "border-border hover:border-green-300 hover:bg-muted/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Cantidad personalizada..."
                min={1}
                max={recipientsTotal}
                value={customSendCount}
                onChange={(e) => {
                  setCustomSendCount(e.target.value);
                  const num = parseInt(e.target.value, 10);
                  if (num > 0) setSendToAllCount(num);
                }}
                onFocus={() => {
                  if (typeof sendToAllCount !== "number" || [500, 1000, 5000].includes(sendToAllCount)) {
                    setSendToAllCount(0);
                  }
                }}
                className={customSendCount ? "border-green-500" : ""}
              />
            </div>

            {campaignName.trim() && (
              <div className="flex justify-between text-sm p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground flex-shrink-0">Campaña:</span>
                <span className="font-bold text-right ml-2">{campaignName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground flex-shrink-0">Enviar a:</span>
              <span className="font-bold">
                {sendToAllCount === "all"
                  ? `${(recipientsTotal + extraEmails.length).toLocaleString()} destinatarios`
                  : sendToAllCount === "extras_only"
                    ? `${extraEmails.length} correos adicionales`
                    : `${sendToAllCount.toLocaleString()} destinatarios`}
              </span>
            </div>
            <div className="text-sm p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex-shrink-0">Asunto:</span>
              </div>
              <p className="font-bold mt-1 break-words">{emailSubject}</p>
            </div>
            <div className="flex justify-between text-sm p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <span className="text-muted-foreground">Tiempo estimado:</span>
              <span className="font-bold text-green-600">
                {(() => {
                  const count = sendToAllCount === "all" ? (recipientsTotal + extraEmails.length) : sendToAllCount === "extras_only" ? extraEmails.length : sendToAllCount;
                  const totalSeg = Math.ceil(count / 12);
                  if (totalSeg < 60) return `~${totalSeg} segundos`;
                  if (totalSeg < 3600) return `~${Math.ceil(totalSeg / 60)} minutos`;
                  const h = Math.floor(totalSeg / 3600);
                  const m = Math.ceil((totalSeg % 3600) / 60);
                  return `~${h}h ${m}min`;
                })()}
              </span>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSendToAllConfirm(false)}
              disabled={isSendingToAll}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendToAll}
              disabled={isSendingToAll || (typeof sendToAllCount === "number" && sendToAllCount <= 0) || (sendToAllCount === "extras_only" && extraEmails.length === 0)}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSendingToAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando envío...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Confirmar envío a {(sendToAllCount === "all" ? (recipientsTotal + extraEmails.length) : sendToAllCount === "extras_only" ? extraEmails.length : sendToAllCount).toLocaleString()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para agregar correos extra */}
      <Dialog open={showAddEmailsDialog} onOpenChange={setShowAddEmailsDialog}>
        <DialogContent className="max-w-md !z-[10001]" overlayClassName="!z-[10000]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Mail className="h-5 w-5" />
              Agregar correos adicionales
            </DialogTitle>
            <DialogDescription>
              Escribe los correos electrónicos a los que también quieres enviar, uno por línea o separados por comas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder={"correo1@ejemplo.com\ncorreo2@ejemplo.com\ncorreo3@ejemplo.com"}
              value={extraEmailsText}
              onChange={(e) => setExtraEmailsText(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {(() => {
                const parsed = extraEmailsText
                  .split(/[\n,;]+/)
                  .map((e) => e.trim().toLowerCase())
                  .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                const unique = [...new Set(parsed)];
                return `${unique.length} correo${unique.length !== 1 ? "s" : ""} válido${unique.length !== 1 ? "s" : ""} detectado${unique.length !== 1 ? "s" : ""}`;
              })()}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setExtraEmailsText(extraEmails.join("\n"));
                setShowAddEmailsDialog(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                const parsed = extraEmailsText
                  .split(/[\n,;]+/)
                  .map((e) => e.trim().toLowerCase())
                  .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                const unique = [...new Set(parsed)];
                setExtraEmails(unique);
                // Guardar en localStorage para persistir entre sesiones
                if (unique.length > 0) {
                  localStorage.setItem("campaign-extra-emails", unique.join("\n"));
                } else {
                  localStorage.removeItem("campaign-extra-emails");
                }
                setShowAddEmailsDialog(false);
                if (unique.length > 0) {
                  toast.success(`${unique.length} correo${unique.length !== 1 ? "s" : ""} adicional${unique.length !== 1 ? "es" : ""} agregado${unique.length !== 1 ? "s" : ""}`);
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Guardar ({(() => {
                const parsed = extraEmailsText
                  .split(/[\n,;]+/)
                  .map((e) => e.trim().toLowerCase())
                  .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                return [...new Set(parsed)].length;
              })()} correos)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
