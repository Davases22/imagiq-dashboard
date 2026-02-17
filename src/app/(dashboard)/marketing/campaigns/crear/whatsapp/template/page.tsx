"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Save, Apple, Smartphone, Send, Users, Search, Loader2, CheckCircle2, Phone, Download, MessageSquare, Clock, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WhatsAppTemplateForm } from "@/components/campaigns/whatsapp/template/template-form";
import { WhatsAppTemplatePreview } from "@/components/campaigns/whatsapp/template/template-preview";
import { TemplateVariables } from "@/components/campaigns/whatsapp/template/template-variables";
import { useState, useCallback, useEffect, useRef } from "react";
import { whatsappTemplateEndpoints } from "@/lib/api";
import { ProductFilterDropdowns, type ProductFilter } from "@/components/campaigns/product-filter-dropdowns";
import { mapBackendArrayToFrontend } from "@/lib/whatsappTemplateMapper";
import { toast } from "sonner";

const RECIPIENTS_PAGE_SIZE = 50;

interface Recipient {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

function mapUsers(users: any[]): Recipient[] {
  return users
    .filter((u: any) => u.telefono || u.celular)
    .map((u: any) => ({
      id: u.id || u._id || String(Math.random()),
      name: `${u.nombre || ""} ${u.apellido || ""}`.trim() || u.email || "Sin nombre",
      firstName: u.nombre || "",
      lastName: u.apellido || "",
      phone: u.celular || u.telefono || "",
      email: u.email || "",
    }));
}

/**
 * Extrae las variables de un texto en formato {{1}}, {{2}}, etc.
 * @param text - Texto que puede contener variables
 * @returns Array de números de variables encontradas, ordenados
 */
function extractVariables(text: string): number[] {
  const matches = text.match(/\{\{(\d+)\}\}/g);
  if (!matches) return [];
  
  return matches
    .map(match => parseInt(match.replace(/\{|\}/g, '')))
    .filter((v, i, arr) => arr.indexOf(v) === i) // Eliminar duplicados
    .sort((a, b) => a - b);
}

/**
 * Construye el component BODY con su example si tiene variables
 * @param bodyText - Texto del cuerpo del mensaje
 * @param variableValues - Valores de ejemplo para las variables
 * @returns Component BODY con structure correcta
 */
function buildBodyComponent(
  bodyText: string,
  variableValues: Record<string, string>
): any {
  const component: any = {
    type: "BODY",
    text: bodyText
  };

  const variables = extractVariables(bodyText);
  
  if (variables.length > 0) {
    const exampleValues = variables.map(varNum => {
      const key = `{{${varNum}}}`;
      return variableValues[key] || `Ejemplo ${varNum}`;
    });
    
    // IMPORTANTE: body_text debe ser un array de arrays
    component.example = {
      body_text: [exampleValues]
    };
  }

  return component;
}

/**
 * Construye el component HEADER con su example si es necesario
 * @param headerType - Tipo de header (TEXT, IMAGE, VIDEO, etc.)
 * @param headerContent - Contenido del header
 * @param variableValues - Valores de ejemplo para las variables
 * @returns Component HEADER con structure correcta o null si es NONE
 */
function buildHeaderComponent(
  headerType: string,
  headerContent: string,
  variableValues: Record<string, string>
): any | null {
  if (!headerType || headerType === "NONE") {
    return null;
  }

  const component: any = {
    type: "HEADER",
    format: headerType
  };

  switch (headerType) {
    case "TEXT":
      component.text = headerContent || "";
      
      const variables = extractVariables(headerContent);
      if (variables.length > 0) {
        const exampleValues = variables.map(varNum => {
          const key = `{{${varNum}}}`;
          return variableValues[key] || `Ejemplo ${varNum}`;
        });
        
        // IMPORTANTE: header_text es un array simple (no anidado)
        component.example = {
          header_text: exampleValues
        };
      }
      break;

    case "IMAGE":
    case "VIDEO":
    case "DOCUMENT":
      // Para media, siempre incluir example con URL de ejemplo
      component.example = {
        header_url: [headerContent || "https://example.com/media"]
      };
      break;

    case "LOCATION":
      // Para ubicación, incluir coordenadas de ejemplo
      component.example = {
        header_location: {
          latitude: 37.7749,
          longitude: -122.4194,
          name: "Ubicación de ejemplo",
          address: "Dirección de ejemplo"
        }
      };
      break;
  }

  return component;
}

/**
 * Construye el component BUTTONS con examples para URLs dinámicas
 * @param buttons - Array de botones del formulario
 * @param variableValues - Valores de ejemplo para las variables
 * @returns Component BUTTONS con structure correcta o null si no hay botones
 */
function buildButtonsComponent(
  buttons: Array<any>,
  variableValues: Record<string, string>
): any | null {
  if (!buttons || buttons.length === 0) {
    return null;
  }

  const formattedButtons = buttons.map(btn => {
    const button: any = {
      type: btn.type,
      text: btn.text || ""
    };

    if (btn.type === "URL") {
      button.url = btn.url || "";
      
      // Si la URL tiene variables, agregar example
      const variables = extractVariables(btn.url);
      if (variables.length > 0) {
        let exampleUrl = btn.url;
        variables.forEach(varNum => {
          const key = `{{${varNum}}}`;
          const value = variableValues[key] || `ejemplo-${varNum}`;
          exampleUrl = exampleUrl.replace(key, value);
        });
        
        // IMPORTANTE: example para URL es un array simple
        button.example = [exampleUrl];
      }
    } else if (btn.type === "PHONE_NUMBER") {
      button.phone_number = btn.phoneNumber || "";
    }

    return button;
  });

  return {
    type: "BUTTONS",
    buttons: formattedButtons
  };
}

export default function CrearPlantillaWhatsAppPage() {
  const router = useRouter();
  const [templateData, setTemplateData] = useState<{
    name: string;
    category: string;
    language: string;
    header: {
      type: string;
      content: string;
    };
    body: string;
    footer: string;
    buttons: Array<{
      id: number;
      type: string;
      text: string;
      phoneNumber?: string;
      url?: string;
    }>;
  }>({
    name: "",
    category: "UTILITY",
    language: "es",
    header: {
      type: "NONE",
      content: "",
    },
    body: "",
    footer: "",
    buttons: [],
  });

  const [variableValues, setVariableValues] = useState<Record<string, string>>({ "{{1}}": "Juan" });
  const [selectedOS, setSelectedOS] = useState<'ios' | 'android'>('ios');

  // Send dialog state
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showPendingApproval, setShowPendingApproval] = useState(false);
  const [pendingTemplateStatus, setPendingTemplateStatus] = useState<string>("pending");
  const [isSavingForSend, setIsSavingForSend] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientsMap, setSelectedRecipientsMap] = useState<Map<string, Recipient>>(new Map());
  const [recipientSearch, setRecipientSearch] = useState("");
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [hasMoreRecipients, setHasMoreRecipients] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingToAll, setIsSendingToAll] = useState(false);
  const [showSendToAllConfirm, setShowSendToAllConfirm] = useState(false);
  const [sendToAllCount, setSendToAllCount] = useState<"all" | number>("all");
  const [customSendCount, setCustomSendCount] = useState("");
  const [productFilter, setProductFilter] = useState<ProductFilter>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  const loadRecipients = useCallback(async (search?: string, filter?: ProductFilter) => {
    setIsLoadingRecipients(true);
    setRecipients([]);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/campaigns/sms-recipients?limit=${RECIPIENTS_PAGE_SIZE}&offset=0${search ? `&search=${encodeURIComponent(search)}` : ""}`;
      if (filter?.categoria) url += `&categoria=${encodeURIComponent(filter.categoria)}`;
      if (filter?.subcategoria) url += `&subcategoria=${encodeURIComponent(filter.subcategoria)}`;
      if (filter?.modelo) url += `&modelo=${encodeURIComponent(filter.modelo)}`;
      const response = await fetch(url,
        { headers: { "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "" } }
      );
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
      const response = await fetch(url,
        { headers: { "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "" } }
      );
      if (response.ok) {
        const data = await response.json();
        const newUsers = mapUsers(data.users || []);
        setRecipients(prev => [...prev, ...newUsers]);
        setRecipientsTotal(data.total || 0);
        setHasMoreRecipients(recipients.length + newUsers.length < (data.total || 0));
      }
    } catch (error) {
      console.error("Error loading more recipients:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [recipients.length, recipientSearch, productFilter]);

  // Infinite scroll
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
      if (newMap.has(recipient.id)) { newMap.delete(recipient.id); } else { newMap.set(recipient.id, recipient); }
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

  const deselectAllRecipients = () => setSelectedRecipientsMap(new Map());

  const handleOpenSendDialog = async () => {
    // Validate form basics
    if (!templateData.name || !templateData.body?.trim()) {
      toast.error("Completa el nombre y el cuerpo del mensaje antes de enviar");
      return;
    }

    setIsSavingForSend(true);
    try {
      // 1. Check if template exists in Meta
      const response = await whatsappTemplateEndpoints.getAll();
      const allTemplates = response.success && response.data
        ? mapBackendArrayToFrontend(response.data)
        : [];
      const found = allTemplates.find(t => t.name === templateData.name);

      if (!found) {
        // Template doesn't exist — save it first
        toast.info("Guardando plantilla en Meta...");
        const saved = await saveTemplateToMeta();
        if (saved) {
          setPendingTemplateStatus("pending");
          setShowPendingApproval(true);
        }
        return;
      }

      if (found.status !== "active") {
        // Template exists but not approved
        setPendingTemplateStatus(found.status);
        setShowPendingApproval(true);
        return;
      }

      // Template is approved — open send dialog
      loadRecipients(undefined, productFilter);
      setShowSendDialog(true);
    } catch (error) {
      console.error("Error checking template:", error);
      toast.error("Error al verificar la plantilla");
    } finally {
      setIsSavingForSend(false);
    }
  };

  // Extracted save logic to reuse from handleOpenSendDialog
  const saveTemplateToMeta = async (): Promise<boolean> => {
    try {
      if (!templateData.name || !/^[a-z0-9_]+$/.test(templateData.name)) {
        toast.error("Nombre inválido. Usa solo minúsculas, números y guiones bajos (_)");
        return false;
      }
      if (templateData.name.length < 3 || templateData.name.length > 512) {
        toast.error("El nombre debe tener entre 3 y 512 caracteres");
        return false;
      }
      if (templateData.header?.type === "TEXT" && (!templateData.header?.content || templateData.header.content.trim().length === 0)) {
        toast.error("El texto del encabezado es requerido cuando el tipo es Texto");
        return false;
      }
      if (!templateData.body || templateData.body.trim().length === 0) {
        toast.error("El cuerpo del mensaje es requerido");
        return false;
      }
      if (!/^[a-z]{2}(_[A-Z]{2})?$/.test(templateData.language)) {
        toast.error("Formato de idioma inválido");
        return false;
      }

      // Check for duplicate template name before creating
      const existingResponse = await whatsappTemplateEndpoints.getAll();
      if (existingResponse.success && existingResponse.data) {
        const existingTemplates = mapBackendArrayToFrontend(existingResponse.data);
        const duplicate = existingTemplates.find(t => t.name === templateData.name);
        if (duplicate) {
          toast.error(`Ya existe una plantilla con el nombre "${templateData.name}". Usa un nombre diferente o elimina la existente primero.`);
          return false;
        }
      }

      const bodyVariables = (templateData.body.match(/\{\{\d+\}\}/g) || []).length;
      const bodyWordCount = templateData.body.trim().split(/\s+/).length;
      const minWordsRequired: Record<number, number> = { 1: 15, 2: 25, 3: 40, 4: 60, 5: 60 };
      if (bodyVariables > 0) {
        const minWords = minWordsRequired[bodyVariables] || 60;
        if (bodyWordCount < minWords) {
          toast.error(`El mensaje es muy corto para ${bodyVariables} variable(s). Necesitas al menos ${minWords} palabras.`);
          return false;
        }
      }

      const components: any[] = [];
      const headerComponent = buildHeaderComponent(templateData.header?.type, templateData.header?.content, variableValues);
      if (headerComponent) components.push(headerComponent);
      components.push(buildBodyComponent(templateData.body, variableValues));
      if (templateData.footer?.trim()) components.push({ type: "FOOTER", text: templateData.footer });
      const buttonsComponent = buildButtonsComponent(templateData.buttons, variableValues);
      if (buttonsComponent) components.push(buttonsComponent);

      const payload = {
        name: templateData.name,
        category: templateData.category as "MARKETING" | "UTILITY" | "AUTHENTICATION",
        language: templateData.language,
        components,
      };

      const res = await whatsappTemplateEndpoints.create(payload);
      // Validate both HTTP status and response data
      // The microservice may return errors wrapped in HTTP 200 via TCP gateway
      const resData = res.data as any;
      const hasError = resData?.ok === false || resData?.error || (!resData?.id && !resData?.success);

      if (res.success && !hasError) {
        toast.success("Plantilla guardada correctamente en Meta");
        return true;
      } else {
        // Extract error message from various response formats
        let errorMsg = res.message || "No se pudo crear la plantilla";
        if (resData?.error) {
          if (typeof resData.error === 'string') {
            try {
              const parsed = JSON.parse(resData.error);
              errorMsg = parsed?.error?.message || parsed?.message || resData.error;
            } catch {
              errorMsg = resData.error;
            }
          } else if (typeof resData.error === 'object') {
            errorMsg = resData.error?.message || resData.error?.error?.message || JSON.stringify(resData.error);
          }
        }
        toast.error(errorMsg);
        return false;
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Error al guardar la plantilla");
      return false;
    }
  };

  const [bulkProgress, setBulkProgress] = useState<{ progress: number; sent: number; total: number } | null>(null);

  // Validates template exists and is approved, returns the template or null
  const validateTemplate = async (): Promise<{ id: string; name: string } | null> => {
    const response = await whatsappTemplateEndpoints.getAll();
    if (!response.success || !response.data) {
      toast.error("No se pudieron cargar las plantillas");
      return null;
    }
    const templates = mapBackendArrayToFrontend(response.data);
    const found = templates.find(t => t.name === templateData.name);
    if (!found) {
      toast.error("Esta plantilla no existe en Meta. Primero guárdala con 'Guardar Plantilla' y espera su aprobación.");
      return null;
    }
    if (found.status !== "active") {
      toast.error(`La plantilla "${found.name}" está en estado "${found.status}". Debe estar aprobada (activa) por Meta para poder enviar.`);
      return null;
    }
    return found;
  };

  // Polls a bulk job until completion
  const pollBulkJob = async (jobId: string): Promise<{ sent: number; failed: number; total: number }> => {
    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          const statusRes = await whatsappTemplateEndpoints.getBulkJobStatus(jobId);
          if (statusRes.success && statusRes.data) {
            const { status, sent, failed, total, progress } = statusRes.data;
            setBulkProgress({ progress, sent, total });

            if (status === "completed" || status === "failed") {
              clearInterval(interval);
              setBulkProgress(null);
              resolve({ sent, failed, total });
            }
          }
        } catch {
          // Ignore polling errors, will retry
        }
      }, 3000);
    });
  };

  const handleSendWhatsApp = async () => {
    if (selectedRecipientsMap.size === 0) {
      toast.error("Selecciona al menos un destinatario");
      return;
    }
    setIsSending(true);
    try {
      const found = await validateTemplate();
      if (!found) { setIsSending(false); return; }

      const selectedUsers = Array.from(selectedRecipientsMap.values());
      const recipients = selectedUsers.map((recipient) => ({
        to: recipient.phone,
        variables: [recipient.firstName || recipient.name.split(" ")[0] || recipient.name],
      }));

      // Start bulk job
      const startRes = await whatsappTemplateEndpoints.sendTemplateBulk({
        template_id: found.id,
        recipients,
        batch_size: 20,
        delay_ms: 1000,
      });

      if (!startRes.success || !startRes.data?.jobId) {
        toast.error("Error al iniciar el envío");
        setIsSending(false);
        return;
      }

      toast.info(`Enviando a ${recipients.length} destinatarios...`);

      // Poll for completion
      const result = await pollBulkJob(startRes.data.jobId);

      if (result.failed === 0) {
        toast.success(`${result.sent} mensajes de WhatsApp enviados correctamente`);
      } else if (result.sent === 0) {
        toast.error("Error: No se pudo enviar ningún mensaje");
      } else {
        toast.warning(`${result.sent}/${result.total} enviados. ${result.failed} fallaron.`);
      }
      setShowSendDialog(false);
      setSelectedRecipientsMap(new Map());
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      toast.error("Error al enviar los mensajes");
    } finally {
      setIsSending(false);
    }
  };

  const createExampleTemplate = () => {
    setTemplateData({
      name: "actualizacion_disponibilidad",
      category: "UTILITY",
      language: "es",
      header: {
        type: "TEXT",
        content: "Actualización de disponibilidad",
      },
      body: "Hola {{1}}, te informamos que la línea Samsung Galaxy S25 ya se encuentra disponible en nuestra tienda imagiq. Puedes consultar especificaciones, colores y precios actualizados directamente en nuestro sitio web. Si tienes alguna consulta, estamos para ayudarte.",
      footer: "imagiq - Samsung Store Oficial",
      buttons: [
        {
          id: 1,
          type: "URL",
          text: "Ver detalles",
          url: "https://www.imagiq.com/productos"
        },
        {
          id: 2,
          type: "QUICK_REPLY",
          text: "Tengo una consulta"
        }
      ],
    });
    setVariableValues({ "{{1}}": "Juan" });
    toast.success("Ejemplo de texto cargado");
  };

  const createImageExample = () => {
    setTemplateData({
      name: "nuevo_producto_disponible",
      category: "UTILITY",
      language: "es",
      header: {
        type: "IMAGE",
        content: "https://res.cloudinary.com/dbqgbemui/image/upload/v1761873777/Samsung_Store_deken7.png",
      },
      body: "Hola {{1}}, te informamos que el Samsung Galaxy Z Fold 6 ya está disponible en imagiq. Precio desde $5.999.000 COP con envío a toda Colombia. Consulta colores, capacidades y detalles técnicos en nuestra tienda. Para cualquier duda sobre este producto, estamos disponibles.",
      footer: "imagiq - Samsung Store Oficial",
      buttons: [
        {
          id: 1,
          type: "URL",
          text: "Ver producto",
          url: "https://www.imagiq.com/productos"
        }
      ],
    });
    setVariableValues({ "{{1}}": "María" });
    toast.success("Ejemplo con imagen cargado");
  };

  const createLocationExample = () => {
    setTemplateData({
      name: "informacion_tienda_fisica",
      category: "UTILITY",
      language: "es",
      header: {
        type: "LOCATION",
        content: "",
      },
      body: "Hola {{1}}, te compartimos la ubicación de nuestra tienda imagiq Samsung Store. Nuestro horario de atención es de lunes a sábado de 9:00 AM a 7:00 PM. Puedes visitarnos para conocer los productos disponibles o agendar una cita personalizada con uno de nuestros asesores.",
      footer: "imagiq - Samsung Store Oficial",
      buttons: [
        {
          id: 1,
          type: "QUICK_REPLY",
          text: "Agendar cita"
        },
        {
          id: 2,
          type: "PHONE_NUMBER",
          text: "Llamar a la tienda",
          phoneNumber: "+57 601 234 5678"
        }
      ],
    });
    setVariableValues({ "{{1}}": "Carlos" });
    toast.success("Ejemplo de ubicación cargado");
  };

  const createDocumentExample = () => {
    setTemplateData({
      name: "catalogo_productos_samsung",
      category: "UTILITY",
      language: "es",
      header: {
        type: "DOCUMENT",
        content: "https://www.imagiq.com/catalogos/samsung-2025.pdf",
      },
      body: "Hola {{1}}, te compartimos el catálogo actualizado de productos Samsung disponibles en imagiq. Incluye especificaciones técnicas, precios y disponibilidad de celulares, televisores y accesorios. Si necesitas asesoría para elegir el producto adecuado, responde este mensaje.",
      footer: "imagiq - Samsung Store Oficial",
      buttons: [
        {
          id: 1,
          type: "URL",
          text: "Ver catálogo web",
          url: "https://www.imagiq.com/catalogo"
        },
        {
          id: 2,
          type: "QUICK_REPLY",
          text: "Necesito asesoría"
        }
      ],
    });
    setVariableValues({ "{{1}}": "Andrea" });
    toast.success("Ejemplo de documento cargado");
  };

  const createVideoExample = () => {
    setTemplateData({
      name: "resena_galaxy_s25_ultra",
      category: "UTILITY",
      language: "es",
      header: {
        type: "VIDEO",
        content: "https://www.imagiq.com/videos/galaxy-s25-review.mp4",
      },
      body: "Hola {{1}}, te compartimos la reseña del Samsung Galaxy S25 Ultra disponible en imagiq. En el video encontrarás detalles sobre su cámara de 200MP, Galaxy AI y batería de 5000mAh. Si deseas conocer precios o disponibilidad, puedes consultarnos directamente por este medio.",
      footer: "imagiq - Samsung Store Oficial",
      buttons: [
        {
          id: 1,
          type: "URL",
          text: "Ver especificaciones",
          url: "https://www.imagiq.com/productos/galaxy-s25-ultra"
        },
        {
          id: 2,
          type: "QUICK_REPLY",
          text: "Consultar precio"
        }
      ],
    });
    setVariableValues({ "{{1}}": "Pedro" });
    toast.success("Ejemplo de video cargado");
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTemplate = async () => {
    setIsSaving(true);
    try {
      const saved = await saveTemplateToMeta();
      if (saved) {
        router.push("/marketing/campaigns/templates/whatsapp");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/marketing/campaigns/crear">
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">Crear Plantilla de WhatsApp</h1>
              <p className="text-xs text-muted-foreground">
                Diseña una plantilla de mensaje que podrás usar en tus campañas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-1 border rounded-lg p-0.5">
              <Button
                variant={selectedOS === 'ios' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedOS('ios')}
                className="text-xs h-7 px-2"
              >
                <Apple className="h-3 w-3 mr-1" />
                iOS
              </Button>
              <Button
                variant={selectedOS === 'android' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedOS('android')}
                className="text-xs h-7 px-2"
              >
                <Smartphone className="h-3 w-3 mr-1" />
                Android
              </Button>
            </div>
            <Button size="sm" onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {isSaving ? "Guardando..." : "Guardar Plantilla"}
            </Button>
            <Button size="sm" onClick={handleOpenSendDialog} disabled={isSavingForSend} className="bg-green-600 hover:bg-green-700">
              {isSavingForSend ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1 px-6 pb-2">
          <span className="text-xs text-muted-foreground mr-1">Ejemplos:</span>
          <Button variant="outline" size="sm" onClick={createExampleTemplate} className="text-xs h-7 px-2">
            Texto
          </Button>
          <Button variant="outline" size="sm" onClick={createImageExample} className="text-xs h-7 px-2">
            Imagen
          </Button>
          <Button variant="outline" size="sm" onClick={createLocationExample} className="text-xs h-7 px-2">
            Ubicación
          </Button>
          <Button variant="outline" size="sm" onClick={createDocumentExample} className="text-xs h-7 px-2">
            Documento
          </Button>
          <Button variant="outline" size="sm" onClick={createVideoExample} className="text-xs h-7 px-2">
            Video
          </Button>
        </div>
      </div>

      {/* Content - Grid with controlled heights */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          {/* Form Section - scrollable */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Plantilla</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Completa todos los campos requeridos para crear tu plantilla
                </p>
              </CardHeader>
              <CardContent>
                <WhatsAppTemplateForm
                  templateData={templateData}
                  onTemplateDataChange={setTemplateData}
                />
              </CardContent>
            </Card>

            {/* Variable Values Section */}
            <TemplateVariables
              bodyText={templateData.body}
              headerText={templateData.header.type === "TEXT" ? templateData.header.content : ""}
              variableValues={variableValues}
              onVariableValuesChange={setVariableValues}
            />
          </div>

          {/* Preview Section - sticky */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <WhatsAppTemplatePreview
              templateData={templateData}
              variableValues={variableValues}
              selectedOS={selectedOS}
            />
          </div>
        </div>
      </div>

      {/* Dialog de envío de WhatsApp */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="!max-w-3xl h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Enviar WhatsApp
            </DialogTitle>
            <DialogDescription>
              Selecciona los destinatarios para enviar tu plantilla de WhatsApp
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
                <p className="font-medium truncate">{templateData.name}</p>
              </div>
              <Badge variant="secondary">{templateData.category}</Badge>
            </div>

            {/* Total de destinatarios + Enviar a todos */}
            {recipientsTotal > 0 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                <div className="h-10 w-10 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg text-green-600">{recipientsTotal.toLocaleString()} destinatarios</p>
                </div>
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

            {/* Buscador */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") loadRecipients(recipientSearch, productFilter); }}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => loadRecipients(recipientSearch, productFilter)} disabled={isLoadingRecipients}>
                {isLoadingRecipients ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
              <Button variant="outline" size="sm" onClick={selectAllRecipients}>Seleccionar cargados</Button>
              <Button variant="outline" size="sm" onClick={deselectAllRecipients}>Limpiar</Button>
              <Button
                variant="outline" size="sm" disabled={recipients.length === 0} className="gap-1"
                onClick={() => {
                  const csvContent = [
                    ["Nombre", "Teléfono", "Email"].join(","),
                    ...recipients.map(r => [`"${r.name.replace(/"/g, '""')}"`, `"${r.phone}"`, `"${r.email || ""}"`].join(","))
                  ].join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `destinatarios-whatsapp-${new Date().toISOString().split("T")[0]}.csv`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                  toast.success(`${recipients.length} contactos exportados a CSV`);
                }}
              >
                <Download className="h-4 w-4" />CSV
              </Button>
            </div>

            {/* Contador */}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedRecipientsMap.size} seleccionados · Mostrando {recipients.length} de {recipientsTotal.toLocaleString()} destinatarios
              </span>
              {selectedRecipientsMap.size > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  <CheckCircle2 className="h-3 w-3 mr-1" />{selectedRecipientsMap.size} seleccionados
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
                          selectedRecipientsMap.has(recipient.id) ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                        }`}
                        onClick={() => toggleRecipient(recipient)}
                      >
                        <Checkbox
                          checked={selectedRecipientsMap.has(recipient.id)}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() => toggleRecipient(recipient)}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate">{recipient.name}</span>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" /><span className="truncate">{recipient.phone}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {hasMoreRecipients && (
                      <div ref={loadMoreSentinelRef} className="flex items-center justify-center py-4">
                        {isLoadingMore ? (
                          <><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="ml-2 text-xs text-muted-foreground">Cargando más...</span></>
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

          {/* Progress bar */}
          {bulkProgress && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Enviando... {bulkProgress.sent.toLocaleString()} de {bulkProgress.total.toLocaleString()}</span>
                <span>{bulkProgress.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${bulkProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setShowSendDialog(false); setSelectedRecipientsMap(new Map()); }} disabled={isSending}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendWhatsApp}
              disabled={isSending || selectedRecipientsMap.size === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSending ? `Enviando...` : `Enviar a ${selectedRecipientsMap.size} destinatario(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para enviar a todos */}
      <Dialog open={showSendToAllConfirm} onOpenChange={(open) => { setShowSendToAllConfirm(open); if (!open) { setSendToAllCount("all"); setCustomSendCount(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Users className="h-5 w-5" />
              Enviar WhatsApp masivo
            </DialogTitle>
            <DialogDescription>
              Selecciona cuántos destinatarios quieres alcanzar. El envío se procesará en lotes en el servidor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad de destinatarios</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "all" as const, label: `Todos (${recipientsTotal.toLocaleString()})` },
                  { value: 500, label: "500" },
                  { value: 1000, label: "1.000" },
                  { value: 5000, label: "5.000" },
                ].map((option) => (
                  <Button
                    key={String(option.value)}
                    variant={sendToAllCount === option.value ? "default" : "outline"}
                    size="sm"
                    className={sendToAllCount === option.value ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setSendToAllCount(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="text-muted-foreground">
                Tiempo estimado: ~{(() => {
                  const count = sendToAllCount === "all" ? recipientsTotal : sendToAllCount;
                  const secs = Math.ceil(count / 20);
                  return secs < 60 ? `${secs}s` : secs < 3600 ? `${Math.ceil(secs / 60)} min` : `${Math.floor(secs / 3600)}h ${Math.ceil((secs % 3600) / 60)}min`;
                })()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendToAllConfirm(false)}>Cancelar</Button>
            <Button
              disabled={isSendingToAll}
              onClick={async () => {
                setIsSendingToAll(true);
                try {
                  const found = await validateTemplate();
                  if (!found) return;

                  // Fetch ALL recipients paginated
                  const limit = sendToAllCount === "all" ? recipientsTotal : sendToAllCount;
                  const PAGE_SIZE = 200;
                  let allRecipients: Recipient[] = [];
                  let offset = 0;
                  let keepFetching = true;

                  toast.info(`Cargando ${limit.toLocaleString()} destinatarios...`);

                  while (keepFetching && allRecipients.length < limit) {
                    let fetchUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/campaigns/sms-recipients?limit=${PAGE_SIZE}&offset=${offset}`;
                    if (productFilter?.categoria) fetchUrl += `&categoria=${encodeURIComponent(productFilter.categoria)}`;
                    if (productFilter?.subcategoria) fetchUrl += `&subcategoria=${encodeURIComponent(productFilter.subcategoria)}`;
                    if (productFilter?.modelo) fetchUrl += `&modelo=${encodeURIComponent(productFilter.modelo)}`;
                    const res = await fetch(fetchUrl,
                      { headers: { "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "" } }
                    );
                    if (!res.ok) break;
                    const data = await res.json();
                    const mapped = mapUsers(data.users || []);
                    allRecipients = [...allRecipients, ...mapped];
                    offset += PAGE_SIZE;
                    keepFetching = mapped.length === PAGE_SIZE;
                  }

                  allRecipients = allRecipients.slice(0, limit);

                  if (allRecipients.length === 0) {
                    toast.error("No se encontraron destinatarios con teléfono.");
                    return;
                  }

                  const bulkRecipients = allRecipients.map((r) => ({
                    to: r.phone,
                    variables: [r.firstName || r.name.split(" ")[0] || r.name],
                  }));

                  // Start background job
                  const startRes = await whatsappTemplateEndpoints.sendTemplateBulk({
                    template_id: found.id,
                    recipients: bulkRecipients,
                    batch_size: 30,
                    delay_ms: 1000,
                  });

                  if (!startRes.success || !startRes.data?.jobId) {
                    toast.error("Error al iniciar el envío masivo");
                    return;
                  }

                  setShowSendToAllConfirm(false);
                  toast.info(`Envío masivo iniciado: ${allRecipients.length.toLocaleString()} destinatarios. Puedes cerrar esta ventana, el envío continuará en el servidor.`);

                  // Poll for progress
                  const result = await pollBulkJob(startRes.data.jobId);

                  if (result.failed === 0) {
                    toast.success(`${result.sent.toLocaleString()} mensajes enviados correctamente`);
                  } else if (result.sent === 0) {
                    toast.error("Error: No se pudo enviar ningún mensaje");
                  } else {
                    toast.warning(`${result.sent.toLocaleString()}/${result.total.toLocaleString()} enviados. ${result.failed.toLocaleString()} fallaron.`);
                  }
                  setShowSendDialog(false);
                } catch (error) {
                  console.error("Error in bulk send:", error);
                  toast.error("Error al enviar los mensajes");
                } finally {
                  setIsSendingToAll(false);
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSendingToAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSendingToAll ? "Enviando..." : "Confirmar envío"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de "Esperando aprobación de Meta" */}
      <Dialog open={showPendingApproval} onOpenChange={setShowPendingApproval}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <Clock className="h-5 w-5" />
              Esperando aprobación de Meta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Plantilla: {templateData.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estado: <Badge variant="outline" className="border-yellow-300 text-yellow-700 ml-1">{pendingTemplateStatus}</Badge>
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Tu plantilla ha sido enviada a Meta para revisión. Este proceso suele tardar entre <strong className="text-foreground">2 a 5 minutos</strong>, pero en algunos casos puede tardar hasta 24 horas.
              </p>
              <p>
                Una vez aprobada, podrás enviarla a tus clientes. Vuelve a hacer clic en <strong className="text-foreground">Enviar</strong> para verificar el estado.
              </p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Consejos para aprobación rápida:</p>
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  <li>Evita contenido engañoso o agresivo</li>
                  <li>No incluyas URLs acortadas (bit.ly, etc.)</li>
                  <li>Asegúrate de que el texto sea claro y profesional</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPendingApproval(false)}>
              Cerrar
            </Button>
            <Button
              onClick={async () => {
                setShowPendingApproval(false);
                handleOpenSendDialog();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Verificar y enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
