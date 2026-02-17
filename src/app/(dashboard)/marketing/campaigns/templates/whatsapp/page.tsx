"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, MoreHorizontal, Edit, Trash2, MessageSquare, Eye, TrendingUp, Copy, ArrowUp, ArrowDown, Send, Users, Search, Phone, Loader2, Download, CheckCircle2 } from "lucide-react";
import { WhatsAppTemplate } from "@/types";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { whatsappTemplateEndpoints } from "@/lib/api";
import { mapBackendArrayToFrontend } from "@/lib/whatsappTemplateMapper";
import { toast } from "sonner";
import { TemplatePreviewModal } from "@/components/campaigns/whatsapp/template/template-preview-modal";
import { ProductFilterDropdowns, type ProductFilter } from "@/components/campaigns/product-filter-dropdowns";

interface Recipient {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Activa</Badge>;
    case 'inactive':
      return <Badge variant="secondary">Inactiva</Badge>;
    case 'pending':
      return <Badge variant="outline" className="border-yellow-300 text-yellow-800 dark:border-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">Pendiente</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rechazada</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getCategoryBadge = (category: string) => {
  switch (category) {
    case 'MARKETING':
      return <Badge variant="outline" className="border-blue-300 text-blue-800 dark:border-blue-700 dark:text-blue-300">Marketing</Badge>;
    case 'UTILITY':
      return <Badge variant="outline" className="border-purple-300 text-purple-800 dark:border-purple-700 dark:text-purple-300">Utilidad</Badge>;
    case 'AUTHENTICATION':
      return <Badge variant="outline" className="border-gray-300 text-gray-800 dark:border-gray-700 dark:text-gray-300">Autenticación</Badge>;
    default:
      return <Badge variant="secondary">{category}</Badge>;
  }
};

const MetricCard = ({ label, value, change, icon: Icon, compact = false }: {
  label: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  compact?: boolean;
}) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 p-2 border rounded bg-background/50">
        <Icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        <div className="text-xs">
          <div className="font-medium truncate">{value}</div>
          <div className="text-muted-foreground truncate">{label}</div>
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${
            change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {change >= 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
            <span className="text-xs">{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default function WhatsAppTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  // Send dialog states
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientsMap, setSelectedRecipientsMap] = useState<Map<string, Recipient>>(new Map());
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreRecipients, setHasMoreRecipients] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingToAll, setIsSendingToAll] = useState(false);
  const [showSendToAllConfirm, setShowSendToAllConfirm] = useState(false);
  const [sendToAllCount, setSendToAllCount] = useState<"all" | number>("all");
  const [customSendCount, setCustomSendCount] = useState("");
  const [productFilter, setProductFilter] = useState<ProductFilter>({});
  const [extraPhones, setExtraPhones] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("campaign-extra-phones");
      if (saved) {
        return saved.split(/[\n,;]+/).map((p) => p.trim().replace(/\D/g, "")).filter((p) => p.length >= 7);
      }
    }
    return [];
  });
  const [extraPhonesText, setExtraPhonesText] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("campaign-extra-phones") || "";
    }
    return "";
  });
  const [showAddPhonesDialog, setShowAddPhonesDialog] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const response = await whatsappTemplateEndpoints.getAll();
        
        if (response.success && response.data) {
          const mappedTemplates = mapBackendArrayToFrontend(response.data);
          // Ocultar plantillas del sistema creadas antes del 12 de febrero de 2026
          const cutoffDate = new Date("2026-02-12T00:00:00Z");
          const filtered = mappedTemplates.filter(t => t.createdAt >= cutoffDate);
          setTemplates(filtered);
        } else {
          console.error("Error fetching templates:", response.message);
          toast.error("Error al cargar las plantillas");
          setTemplates([]);
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast.error("Error al conectar con el servidor");
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleDeleteTemplate = async (template: WhatsAppTemplate) => {
    try {
      setDeletingTemplateId(template.id);
      const response = await whatsappTemplateEndpoints.delete(template.name);
      if (response.success) {
        setTemplates(templates.filter(t => t.id !== template.id));
        toast.success("Plantilla eliminada correctamente");
      } else {
        toast.error(response.message || "Error al eliminar la plantilla");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const handlePreviewTemplate = (template: WhatsAppTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewTemplate(null);
  };

  const handleCleanDuplicates = async () => {
    try {
      const response = await whatsappTemplateEndpoints.cleanDuplicates();
      if (response.success) {
        toast.success(`Duplicados eliminados: ${response.data?.removed || 0} plantillas`);
        // Recargar la lista
        const refreshResponse = await whatsappTemplateEndpoints.getAll();
        if (refreshResponse.success && refreshResponse.data) {
          const mappedTemplates = mapBackendArrayToFrontend(refreshResponse.data);
          const cutoff = new Date("2026-02-12T00:00:00Z");
          const filtered = mappedTemplates.filter(t => t.createdAt >= cutoff);
          setTemplates(filtered);
        }
      } else {
        toast.error(response.message || "Error al limpiar duplicados");
      }
    } catch (error) {
      console.error("Error cleaning duplicates:", error);
      toast.error("Error al conectar con el servidor");
    }
  };

  // ==================== SEND DIALOG LOGIC ====================

  const RECIPIENTS_PAGE_SIZE = 500;

  const mapUsers = (users: any[]): Recipient[] =>
    users.map((user: any) => ({
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
    }));

  const loadRecipients = useCallback(async (search?: string, filter?: ProductFilter) => {
    setIsLoadingRecipients(true);
    setRecipients([]);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/campaigns/sms-recipients?limit=${RECIPIENTS_PAGE_SIZE}&offset=0${search ? `&search=${encodeURIComponent(search)}` : ""}`;
      if (filter?.categoria) url += `&categoria=${encodeURIComponent(filter.categoria)}`;
      if (filter?.subcategoria) url += `&subcategoria=${encodeURIComponent(filter.subcategoria)}`;
      if (filter?.modelo) url += `&modelo=${encodeURIComponent(filter.modelo)}`;
      const response = await fetch(url, {
        headers: { "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "" },
      });
      if (response.ok) {
        const data = await response.json();
        const recipientsList = mapUsers(data.users || []);
        setRecipients(recipientsList);
        setRecipientsTotal(data.total || recipientsList.length);
        setHasMoreRecipients(recipientsList.length < (data.total || 0));
      } else {
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
      let url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/campaigns/sms-recipients?limit=${RECIPIENTS_PAGE_SIZE}&offset=${recipients.length}${recipientSearch ? `&search=${encodeURIComponent(recipientSearch)}` : ""}`;
      if (productFilter?.categoria) url += `&categoria=${encodeURIComponent(productFilter.categoria)}`;
      if (productFilter?.subcategoria) url += `&subcategoria=${encodeURIComponent(productFilter.subcategoria)}`;
      if (productFilter?.modelo) url += `&modelo=${encodeURIComponent(productFilter.modelo)}`;
      const response = await fetch(url, {
        headers: { "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "" },
      });
      if (response.ok) {
        const data = await response.json();
        const newUsers = mapUsers(data.users || []);
        if (newUsers.length === 0) {
          setHasMoreRecipients(false);
        } else {
          setRecipients((prev) => [...prev, ...newUsers]);
          setRecipientsTotal(data.total || 0);
          setHasMoreRecipients(recipients.length + newUsers.length < (data.total || 0));
        }
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

  const toggleRecipient = (recipient: Recipient) => {
    setSelectedRecipientsMap((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(recipient.id)) {
        newMap.delete(recipient.id);
      } else {
        newMap.set(recipient.id, recipient);
      }
      return newMap;
    });
  };

  const selectAllRecipients = () => {
    setSelectedRecipientsMap((prev) => {
      const newMap = new Map(prev);
      recipients.forEach((r) => newMap.set(r.id, r));
      return newMap;
    });
  };

  const deselectAllRecipients = () => {
    setSelectedRecipientsMap(new Map());
  };

  const handleOpenSendDialog = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    setSelectedRecipientsMap(new Map());
    setRecipientSearch("");
    loadRecipients(undefined, productFilter);
    setShowSendDialog(true);
  };

  const handleSendToSelected = async () => {
    if (!selectedTemplate || selectedRecipientsMap.size === 0) return;
    setIsSending(true);
    try {
      const selectedUsers = Array.from(selectedRecipientsMap.values());
      const recipientsData = selectedUsers.map((r) => {
        const whatsappPhone = r.phone.startsWith("57") ? r.phone : `57${r.phone.replace(/\D/g, "")}`;
        return {
          to: whatsappPhone,
          variables: r.firstName ? [r.firstName] : [],
        };
      });
      const response = await whatsappTemplateEndpoints.sendTemplateBulk({
        template_id: selectedTemplate.id,
        recipients: recipientsData,
      });
      if (response.success && response.data) {
        toast.success(`Envío iniciado para ${recipientsData.length} destinatarios`);
        setShowSendDialog(false);
        setSelectedRecipientsMap(new Map());
      } else {
        toast.error(response.message || "Error al enviar WhatsApp");
      }
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      toast.error("Error al enviar los mensajes");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToAll = async () => {
    if (!selectedTemplate) return;
    setIsSendingToAll(true);
    try {
      const maxRecipients = sendToAllCount === "all" ? undefined : sendToAllCount;
      const activeFilter = productFilter?.categoria ? productFilter : undefined;
      const response = await whatsappTemplateEndpoints.sendToAll(
        selectedTemplate.id,
        maxRecipients,
        activeFilter,
        extraPhones.length > 0 ? extraPhones : undefined,
      );
      if (response.success && response.data) {
        const { estimatedTotal } = response.data;
        const extraCount = extraPhones.length;
        const totalWithExtra = (estimatedTotal || 0) + extraCount;
        const secs = Math.ceil(totalWithExtra / 10); // ~10 msg/s for WhatsApp (more conservative)
        const timeStr = secs < 60 ? `${secs}s` : secs < 3600 ? `${Math.ceil(secs / 60)} min` : `${Math.floor(secs / 3600)}h ${Math.ceil((secs % 3600) / 60)}min`;
        toast.success(
          `Envío iniciado para ${totalWithExtra.toLocaleString()} destinatarios${extraCount > 0 ? ` (incluye ${extraCount} teléfonos adicionales)` : ""}. Tiempo estimado: ~${timeStr}.`
        );
        setShowSendToAllConfirm(false);
        setShowSendDialog(false);
        setExtraPhones([]);
        setExtraPhonesText("");
        localStorage.removeItem("campaign-extra-phones");
      } else {
        toast.error(response.message || "Error al enviar WhatsApp");
      }
    } catch (error) {
      console.error("Error sending WhatsApp to all:", error);
      toast.error("Error al enviar los mensajes");
    } finally {
      setIsSendingToAll(false);
    }
  };

  // ==================== TABLE COLUMNS ====================

  const columns: ColumnDef<WhatsAppTemplate>[] = [
    {
      accessorKey: "name",
      header: "Plantilla",
      size: 200,
      minSize: 160,
      maxSize: 200,
      filterFn: (row, id, value) => {
        const name = row.getValue(id) as string;
        const body = row.original.body || '';
        const searchValue = value.toLowerCase();
        return name.toLowerCase().includes(searchValue) || body.toLowerCase().includes(searchValue);
      },
      cell: ({ row }) => {
        const template = row.original;
        // Procesar el texto para reemplazar placeholders con badges inline
        const renderBodyWithVariables = () => {
          if (!template.body) return null;
          
          // Normalizar espacios múltiples a uno solo
          let processedText = template.body.replace(/\s+/g, ' ').trim();
          
          // Si no hay variables, retornar el texto directamente
          if (!template.variables || template.variables.length === 0) {
            return <span>{processedText}</span>;
          }
          
          // Dividir el texto por los placeholders {{número}}
          const parts: (string | number)[] = [];
          let lastIndex = 0;
          const placeholderRegex = /\{\{(\d+)\}\}/g;
          let match;
          let foundPlaceholders = false;
          
          while ((match = placeholderRegex.exec(processedText)) !== null) {
            foundPlaceholders = true;
            // Agregar texto antes del placeholder
            if (match.index > lastIndex) {
              parts.push(processedText.substring(lastIndex, match.index));
            }
            
            // Agregar el índice de la variable (restar 1 porque los placeholders empiezan en 1)
            const varIndex = parseInt(match[1], 10) - 1;
            parts.push(varIndex);
            
            lastIndex = match.index + match[0].length;
          }
          
          // Agregar el texto restante
          if (lastIndex < processedText.length) {
            parts.push(processedText.substring(lastIndex));
          }
          
          // Si no se encontraron placeholders, retornar el texto original
          if (!foundPlaceholders) {
            return <span>{processedText}</span>;
          }
          
          // Si parts está vacío, retornar el texto original
          if (parts.length === 0) {
            return <span>{processedText}</span>;
          }
          
          // Renderizar con badges inline
          return (
            <span>
              {parts.map((part, index) => {
                if (typeof part === 'number') {
                  // Es un índice de variable
                  const variable = template.variables?.[part];
                  if (variable) {
                    return (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 inline-flex align-middle mx-0.5 bg-muted/50 border-muted-foreground/30"
                      >
                        {variable}
                      </Badge>
                    );
                  }
                  return null;
                }
                // Es texto normal
                return <span key={index}>{part}</span>;
              })}
            </span>
          );
        };
        
        return (
          <div className="space-y-1.5 py-2" style={{ maxWidth: '200px', wordBreak: 'break-word' }}>
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="font-medium truncate">{template.name}</span>
            </div>
            <div className="text-xs text-muted-foreground" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
              {renderBodyWithVariables()}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Categoría",
      size: 120,
      minSize: 100,
      cell: ({ row }) => getCategoryBadge(row.getValue("category")),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      size: 100,
      minSize: 80,
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: "metrics",
      header: "Métricas",
      size: 350,
      minSize: 280,
      accessorFn: (row) => {
        // Calcular rendimiento basado en CTR
        const ctr = row.metrics.ctr;
        if (ctr >= 20) return "high";
        if (ctr >= 10) return "medium";
        return "low";
      },
      cell: ({ row }) => {
        const template = row.original;
        return (
          <TooltipProvider>
            <div className="w-full max-w-[280px]">
              {/* Layout en 2 filas: Primera fila con Enviados y CTR, Segunda fila con Tasa apertura */}
              <div className="space-y-1">
                {/* Primera fila: 50% Enviados, 50% CTR */}
                <div className="grid grid-cols-2 gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <MetricCard
                        label="Enviados"
                        value={template.metrics.sent.toLocaleString()}
                        icon={MessageSquare}
                        compact
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total de mensajes enviados</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <MetricCard
                        label="CTR"
                        value={`${template.metrics.ctr}%`}
                        icon={TrendingUp}
                        compact
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tasa de clics sobre mensajes enviados</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Segunda fila: Tasa apertura */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <MetricCard
                      label="Tasa apertura"
                      value={`${template.metrics.openRate}%`}
                      icon={Eye}
                      compact
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Porcentaje de mensajes leídos</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "lastUsed",
      header: "Último uso",
      size: 120,
      minSize: 100,
      cell: ({ row }) => {
        const date = row.getValue("lastUsed") as Date;
        return date ? date.toLocaleDateString() : "Nunca";
      },
    },
    {
      id: "actions",
      enableHiding: false,
      size: 60,
      minSize: 50,
      cell: ({ row }) => {
        const template = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                <Eye className="mr-2 h-4 w-4" />
                Vista previa
              </DropdownMenuItem>
              {template.status === "active" && (
                <DropdownMenuItem onClick={() => handleOpenSendDialog(template)}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-red-600"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. La plantilla "{template.name}" será eliminada permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deletingTemplateId === template.id}>
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteTemplate(template)}
                      disabled={deletingTemplateId === template.id}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deletingTemplateId === template.id ? "Eliminando..." : "Eliminar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const statusOptions = [
    { label: "Activa", value: "active" },
    { label: "Inactiva", value: "inactive" },
    { label: "Pendiente", value: "pending" },
    { label: "Rechazada", value: "rejected" },
  ];

  const categoryOptions = [
    { label: "Marketing", value: "MARKETING" },
    { label: "Utilidad", value: "UTILITY" },
    { label: "Autenticación", value: "AUTHENTICATION" },
  ];

  const performanceOptions = [
    { label: "Alto rendimiento", value: "high" },
    { label: "Rendimiento medio", value: "medium" },
    { label: "Bajo rendimiento", value: "low" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plantillas de WhatsApp</h1>
          <p className="text-muted-foreground">
            Gestiona y monitorea tus plantillas de mensajes de WhatsApp
          </p>
        </div>
        <Link href="/marketing/campaigns/crear/whatsapp/template">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva plantilla
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total plantillas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{templates.length}</div>
                <p className="text-xs text-muted-foreground">
                  {templates.filter(t => t.status === 'active').length} activas
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes enviados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {templates.reduce((acc, t) => acc + t.metrics.sent, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total enviados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa apertura promedio</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {templates.length > 0 
                    ? (templates.reduce((acc, t) => acc + t.metrics.openRate, 0) / templates.length).toFixed(1)
                    : '0.0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Basado en mensajes leídos
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {templates.length > 0
                    ? (templates.reduce((acc, t) => acc + t.metrics.ctr, 0) / templates.length).toFixed(1)
                    : '0.0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Basado en clics sobre entregados
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Plantillas</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={templates}
            searchKey="name"
            loading={isLoading}
            filters={[
              {
                id: "status",
                title: "Estado",
                options: statusOptions,
              },
              {
                id: "category",
                title: "Categoría",
                options: categoryOptions,
              },
              {
                id: "metrics",
                title: "Rendimiento",
                options: performanceOptions,
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Modal de Vista Previa */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
      />

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="!max-w-3xl h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Enviar WhatsApp
            </DialogTitle>
            <DialogDescription>
              Selecciona los destinatarios para enviar la plantilla &quot;{selectedTemplate?.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Info del template */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
              <div className="h-10 w-10 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase font-medium">Plantilla</p>
                <p className="font-medium truncate">{selectedTemplate?.name}</p>
              </div>
              {selectedTemplate?.category && getCategoryBadge(selectedTemplate.category)}
            </div>

            {/* Total de destinatarios + Agregar teléfonos + Enviar a todos */}
            {recipientsTotal > 0 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                <div className="h-10 w-10 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg text-green-600">
                    {(recipientsTotal + extraPhones.length).toLocaleString()} destinatarios
                    {extraPhones.length > 0 && (
                      <span className="text-sm font-normal ml-1">
                        ({recipientsTotal.toLocaleString()} + {extraPhones.length} extra)
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPhonesDialog(true)}
                  className="gap-1 border-green-300 text-green-700 hover:bg-green-100 dark:hover:bg-green-900"
                >
                  <Plus className="h-4 w-4" />
                  {extraPhones.length > 0 ? `${extraPhones.length} extra` : "Agregar"}
                </Button>
                <Button
                  onClick={() => setShowSendToAllConfirm(true)}
                  disabled={isSendingToAll}
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
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadRecipients(recipientSearch, productFilter);
                  }}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => loadRecipients(recipientSearch, productFilter)} disabled={isLoadingRecipients}>
                {isLoadingRecipients ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
              <Button variant="outline" size="sm" onClick={selectAllRecipients}>Seleccionar cargados</Button>
              <Button variant="outline" size="sm" onClick={deselectAllRecipients}>Limpiar</Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const csvContent = [
                    ["Nombre", "Teléfono", "Email"].join(","),
                    ...recipients.map((r) => [`"${r.name.replace(/"/g, '""')}"`, `"${r.phone}"`, `"${r.email || ""}"`].join(","))
                  ].join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `destinatarios-whatsapp-${new Date().toISOString().split("T")[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success(`${recipients.length} contactos exportados a CSV`);
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
                {selectedRecipientsMap.size} seleccionados · Mostrando {recipients.length} de {recipientsTotal.toLocaleString()} destinatarios
              </span>
              {selectedRecipientsMap.size > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {selectedRecipientsMap.size} seleccionados
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
                ) : recipients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Haz clic en Buscar para cargar destinatarios</p>
                    <p className="text-xs mt-1">Solo se mostrarán usuarios con número de teléfono</p>
                  </div>
                ) : (
                  <>
                    {recipients.map((recipient) => (
                      <div
                        key={recipient.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedRecipientsMap.has(recipient.id)
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => toggleRecipient(recipient)}
                      >
                        <Checkbox
                          checked={selectedRecipientsMap.has(recipient.id)}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() => toggleRecipient(recipient)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{recipient.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{recipient.phone}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Sentinel para infinite scroll */}
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
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setShowSendDialog(false); setSelectedRecipientsMap(new Map()); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendToSelected}
              disabled={isSending || selectedRecipientsMap.size === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar a {selectedRecipientsMap.size} destinatario(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para enviar a todos */}
      <Dialog open={showSendToAllConfirm} onOpenChange={(open) => {
        setShowSendToAllConfirm(open);
        if (!open) { setSendToAllCount("all"); setCustomSendCount(""); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Users className="h-5 w-5" />
              Enviar WhatsApp masivo
            </DialogTitle>
            <DialogDescription>
              Selecciona cuántos destinatarios quieres alcanzar.
              El envío se procesará en lotes en el servidor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cantidad de destinatarios</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "all" as const, label: `Todos (${recipientsTotal.toLocaleString()})` },
                  { value: 500, label: "500" },
                  { value: 1000, label: "1.000" },
                  { value: 5000, label: "5.000" },
                ].map((opt) => (
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
              <div className="flex items-center gap-2">
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
                  className={`flex-1 ${customSendCount ? "border-green-500" : ""}`}
                />
              </div>
            </div>

            <div className="flex justify-between text-sm p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Enviar a:</span>
              <span className="font-bold">
                {sendToAllCount === "all"
                  ? `${recipientsTotal.toLocaleString()} destinatarios`
                  : `${sendToAllCount.toLocaleString()} destinatarios`}
              </span>
            </div>
            <div className="flex justify-between text-sm p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Tiempo estimado:</span>
              <span className="font-bold">
                {(() => {
                  const count = sendToAllCount === "all" ? recipientsTotal : sendToAllCount;
                  const totalSeg = Math.ceil(count / 10); // ~10 msg/s for WhatsApp
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
            <Button variant="outline" onClick={() => setShowSendToAllConfirm(false)} disabled={isSendingToAll}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendToAll}
              disabled={isSendingToAll || (typeof sendToAllCount === "number" && sendToAllCount <= 0)}
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
                  Confirmar envío a {(sendToAllCount === "all" ? recipientsTotal : sendToAllCount).toLocaleString()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para agregar teléfonos extra */}
      <Dialog open={showAddPhonesDialog} onOpenChange={setShowAddPhonesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Phone className="h-5 w-5" />
              Agregar teléfonos adicionales
            </DialogTitle>
            <DialogDescription>
              Escribe los números de teléfono a los que también quieres enviar, uno por línea o separados por comas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder={"3151234567\n3209876543\n3001112233"}
              value={extraPhonesText}
              onChange={(e) => setExtraPhonesText(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {(() => {
                const parsed = extraPhonesText.split(/[\n,;]+/).map((p) => p.trim().replace(/\D/g, "")).filter((p) => p.length >= 7);
                const unique = [...new Set(parsed)];
                return `${unique.length} teléfono${unique.length !== 1 ? "s" : ""} válido${unique.length !== 1 ? "s" : ""} detectado${unique.length !== 1 ? "s" : ""}`;
              })()}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setExtraPhonesText(extraPhones.join("\n")); setShowAddPhonesDialog(false); }}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                const parsed = extraPhonesText.split(/[\n,;]+/).map((p) => p.trim().replace(/\D/g, "")).filter((p) => p.length >= 7);
                const unique = [...new Set(parsed)];
                setExtraPhones(unique);
                if (unique.length > 0) {
                  localStorage.setItem("campaign-extra-phones", unique.join("\n"));
                } else {
                  localStorage.removeItem("campaign-extra-phones");
                }
                setShowAddPhonesDialog(false);
                if (unique.length > 0) {
                  toast.success(`${unique.length} teléfono${unique.length !== 1 ? "s" : ""} adicional${unique.length !== 1 ? "es" : ""} agregado${unique.length !== 1 ? "s" : ""}`);
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Guardar ({(() => {
                const parsed = extraPhonesText.split(/[\n,;]+/).map((p) => p.trim().replace(/\D/g, "")).filter((p) => p.length >= 7);
                return [...new Set(parsed)].length;
              })()} teléfonos)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}