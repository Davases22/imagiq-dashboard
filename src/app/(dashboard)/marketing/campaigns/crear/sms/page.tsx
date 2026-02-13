"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  MessageSquare,
  Save,
  Variable,
  Link2,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Loader2,
  Send,
  Users,
  Search,
  Download,
  Phone,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  Database,
  Smile,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { smsTemplateEndpoints, SmsTemplate } from "@/lib/api";

// GSM-7 basic character set
const GSM7_BASIC = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ!"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑܧ¿abcdefghijklmnopqrstuvwxyzäöñüà'.split('')
);

// GSM-7 extended characters (each counts as 2 septets)
const GSM7_EXTENDED = new Set(['^', '{', '}', '\\', '[', '~', ']', '|', '€']);

function isGsm7(text: string): boolean {
  for (const char of text) {
    if (!GSM7_BASIC.has(char) && !GSM7_EXTENDED.has(char)) {
      return false;
    }
  }
  return true;
}

function countSmsCharacters(text: string): {
  charCount: number;
  encoding: 'GSM-7' | 'UCS-2';
  maxSingle: number;
  maxConcat: number;
} {
  if (isGsm7(text)) {
    let count = 0;
    for (const char of text) {
      count += GSM7_EXTENDED.has(char) ? 2 : 1;
    }
    return { charCount: count, encoding: 'GSM-7', maxSingle: 159, maxConcat: 153 };
  } else {
    return { charCount: text.length, encoding: 'UCS-2', maxSingle: 159, maxConcat: 153 };
  }
}

const VARIABLES = [
  { label: "Nombre", value: "nombre", example: "Juan" },
  { label: "Apellido", value: "apellido", example: "Pérez" },
];

const CATEGORIES = [
  { value: "promotional", label: "Promocional", description: "Ofertas y descuentos" },
  { value: "transactional", label: "Transaccional", description: "Confirmaciones y actualizaciones" },
  { value: "reminder", label: "Recordatorio", description: "Citas y vencimientos" },
  { value: "alert", label: "Alerta", description: "Notificaciones urgentes" },
];

const EMOJI_CATEGORIES = [
  {
    name: "Populares",
    emojis: ["🎉", "🔥", "⭐", "💥", "🚀", "💰", "🎁", "✨", "❤️", "👍", "✅", "🙌"],
  },
  {
    name: "Caras",
    emojis: ["😀", "😃", "😄", "😁", "😊", "🥰", "😍", "🤩", "😎", "🤗", "🤔", "😉", "😋", "🥳", "😇", "🙂", "😏", "😌", "🤭", "😜", "🤪", "😝", "🤑", "🤠"],
  },
  {
    name: "Gestos",
    emojis: ["👍", "👎", "👏", "🙌", "🤝", "👊", "✊", "🤞", "✌️", "🤟", "🤙", "👋", "🖐️", "✋", "👌", "🤏", "👆", "👇", "👈", "👉", "💪", "🦾", "🙏", "💅"],
  },
  {
    name: "Corazones",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "😍", "🥰", "😘", "😻"],
  },
  {
    name: "Celebración",
    emojis: ["🎉", "🎊", "🎈", "🎁", "🎀", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🎗️", "🎄", "🎃", "🎂", "🍰", "🧁", "🥂", "🍾", "🎇", "🎆", "✨", "🌟", "💫"],
  },
  {
    name: "Dinero",
    emojis: ["💰", "💵", "💴", "💶", "💷", "💸", "💳", "🪙", "💎", "💲", "🤑", "🏦", "🏧", "💹", "📈", "📉", "🛒", "🛍️", "🏷️", "🎫", "🧾", "💼", "📊", "🔖"],
  },
  {
    name: "Tecnología",
    emojis: ["📱", "💻", "🖥️", "⌨️", "🖱️", "💾", "💿", "📀", "🎮", "🕹️", "📷", "📸", "📹", "🎥", "📺", "📻", "🎧", "🎤", "🔊", "📡", "⌚", "⏰", "⏱️", "🔋"],
  },
  {
    name: "Compras",
    emojis: ["🛒", "🛍️", "🏷️", "💳", "🧾", "📦", "🎁", "📮", "📬", "📭", "📪", "🚚", "🚛", "✈️", "🏠", "🏪", "🏬", "🏭", "🔖", "🎫", "🛎️", "🔑", "🗝️", "📋"],
  },
  {
    name: "Naturaleza",
    emojis: ["🌸", "🌺", "🌻", "🌹", "🌷", "🌱", "🌿", "☘️", "🍀", "🌴", "🌵", "🌾", "🌈", "☀️", "🌙", "⭐", "🌟", "✨", "⚡", "🔥", "💧", "🌊", "❄️", "☁️"],
  },
  {
    name: "Comida",
    emojis: ["🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🍳", "🧇", "🥞", "🧈", "🍞", "🥐", "🥖", "🥨", "🧀", "🍖", "🍗", "🥩", "🥚", "🍜", "🍝", "🍣", "🍱"],
  },
  {
    name: "Bebidas",
    emojis: ["☕", "🍵", "🧃", "🥤", "🧋", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🍾", "🫖", "🥛", "🍼", "🫗", "🧊", "💧", "🚰", "🍯", "🫙"],
  },
  {
    name: "Animales",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺"],
  },
  {
    name: "Símbolos",
    emojis: ["✅", "❌", "⭕", "❗", "❓", "💯", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "▶️", "⏸️", "⏹️", "⏺️", "⏭️", "⏮️", "🔀", "🔁", "🔂"],
  },
  {
    name: "Flechas",
    emojis: ["⬆️", "⬇️", "⬅️", "➡️", "↗️", "↘️", "↙️", "↖️", "↕️", "↔️", "↩️", "↪️", "⤴️", "⤵️", "🔃", "🔄", "🔙", "🔚", "🔛", "🔜", "🔝", "➕", "➖", "➗"],
  },
  {
    name: "Objetos",
    emojis: ["⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺"],
  },
];

interface Recipient {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

export default function CrearSmsTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("promotional");

  // Estados para templates existentes
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Estados para envío de SMS
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientsMap, setSelectedRecipientsMap] = useState<Map<string, Recipient>>(new Map());
  const [recipientSearch, setRecipientSearch] = useState("");
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [recipientsLocalCount, setRecipientsLocalCount] = useState(0);
  const [recipientsNovafolCount, setRecipientsNovafolCount] = useState(0);
  const [hasMoreRecipients, setHasMoreRecipients] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showSendToAllConfirm, setShowSendToAllConfirm] = useState(false);
  const [isSendingToAll, setIsSendingToAll] = useState(false);
  // Track saved state for unsaved changes detection
  const [savedState, setSavedState] = useState<{ name: string; message: string; category: string } | null>(null);
  const hasUnsavedChanges = isEditing && savedState !== null && (
    name !== savedState.name ||
    message !== savedState.message ||
    category !== savedState.category
  );

  // Cargar templates al montar
  useEffect(() => {
    loadTemplates();
  }, []);

  // Cargar templates desde la API
  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await smsTemplateEndpoints.list();
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Cargar templates por defecto (seed)
  const handleSeedTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await smsTemplateEndpoints.seedDefaults();
      if (response.success && response.data) {
        toast.success(`${response.data.created} templates creados, ${response.data.skipped} ya existían`);
        loadTemplates();
      } else {
        toast.error("Error al crear templates por defecto");
      }
    } catch (error) {
      toast.error("Error al crear templates por defecto");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Seleccionar un template existente
  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setSavedTemplateId(templateId);
      setName(template.name);
      setMessage(template.message);
      setCategory(template.category);
      setIsEditing(true);
      setSavedState({ name: template.name, message: template.message, category: template.category });
    }
  };

  // Limpiar formulario para nuevo template
  const handleNewTemplate = () => {
    setSelectedTemplateId(null);
    setSavedTemplateId(null);
    setName("");
    setMessage("");
    setCategory("promotional");
    setIsEditing(false);
    setSavedState(null);
  };

  // Eliminar template
  const handleDeleteTemplate = async () => {
    if (!selectedTemplateId) return;

    if (!confirm("¿Estás seguro de eliminar este template?")) return;

    setIsLoading(true);
    try {
      const response = await smsTemplateEndpoints.delete(selectedTemplateId);
      if (response.success) {
        toast.success("Template eliminado");
        handleNewTemplate();
        loadTemplates();
      } else {
        toast.error("Error al eliminar el template");
      }
    } catch (error) {
      toast.error("Error al eliminar el template");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular estadísticas del mensaje
  // Reemplazar variables con 10 caracteres para estimar el largo real
  const getEstimatedMessage = () => {
    let estimated = message;
    VARIABLES.forEach(v => {
      estimated = estimated.replace(new RegExp(`\\{\\{${v.value}\\}\\}`, 'g'), 'X'.repeat(15));
    });
    return estimated;
  };
  const estimatedMessage = getEstimatedMessage();
  const smsInfo = countSmsCharacters(estimatedMessage);
  const characterCount = smsInfo.charCount;
  const maxSingle = smsInfo.maxSingle;
  const maxConcat = smsInfo.maxConcat;
  const isOverLimit = characterCount > maxSingle;
  const segmentCount = characterCount <= maxSingle
    ? 1
    : Math.ceil(characterCount / maxConcat);
  const remainingChars = characterCount <= maxSingle
    ? maxSingle - characterCount
    : maxConcat - (characterCount % maxConcat || maxConcat);

  // Detectar variables usadas
  const variablesUsed = VARIABLES.filter(v => message.includes(`{{${v.value}}}`));

  // Preview con variables reemplazadas
  const getPreviewMessage = () => {
    let preview = message;
    VARIABLES.forEach(v => {
      preview = preview.replace(new RegExp(`\\{\\{${v.value}\\}\\}`, 'g'), v.example);
    });
    return preview;
  };

  const handleInsertVariable = (variable: string) => {
    setMessage(prev => prev + `{{${variable}}}`);
  };

  const handleInsertLink = () => {
    setLinkUrl("");
    setShowLinkDialog(true);
  };

  const handleConfirmLink = () => {
    if (linkUrl.trim()) {
      setMessage(prev => prev + ` ${linkUrl.trim()}`);
      setShowLinkDialog(false);
      setLinkUrl("");
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const RECIPIENTS_PAGE_SIZE = 500;

  // Mapear respuesta de la API a Recipient[]
  const mapUsers = (users: any[]): Recipient[] =>
    users.map((user: { id: string; name: string; firstName: string; lastName: string; phone: string; email: string }) => ({
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
    }));

  // Cargar destinatarios desde la API (combina local + Novafol/VirtualMedios)
  const loadRecipients = useCallback(async (search?: string) => {
    setIsLoadingRecipients(true);
    setRecipients([]);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/campaigns/sms-recipients?limit=${RECIPIENTS_PAGE_SIZE}&offset=0${search ? `&search=${encodeURIComponent(search)}` : ""}`,
        {
          headers: {
            "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const recipientsList = mapUsers(data.users || []);
        setRecipients(recipientsList);
        setRecipientsTotal(data.total || recipientsList.length);
        setRecipientsLocalCount(data.localCount || 0);
        setRecipientsNovafolCount(data.novafolCount || 0);
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

  // Cargar más destinatarios (siguiente página)
  const loadMoreRecipients = useCallback(async () => {
    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/campaigns/sms-recipients?limit=${RECIPIENTS_PAGE_SIZE}&offset=${recipients.length}${recipientSearch ? `&search=${encodeURIComponent(recipientSearch)}` : ""}`,
        {
          headers: {
            "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
          },
        }
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
  }, [recipients.length, recipientSearch]);

  // Infinite scroll: auto-load more when sentinel is visible
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

  // Toggle selección de destinatario
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

  // Seleccionar todos (de la búsqueda actual)
  const selectAllRecipients = () => {
    setSelectedRecipientsMap((prev) => {
      const newMap = new Map(prev);
      recipients.forEach((r) => newMap.set(r.id, r));
      return newMap;
    });
  };

  // Deseleccionar todos
  const deselectAllRecipients = () => {
    setSelectedRecipientsMap(new Map());
  };

  // Guardar template (crear o actualizar)
  const handleSave = async (): Promise<SmsTemplate | null> => {
    if (!name.trim()) {
      toast.error("Por favor ingresa un nombre para el template");
      return null;
    }
    if (!message.trim()) {
      toast.error("Por favor ingresa el mensaje del template");
      return null;
    }

    setIsLoading(true);
    try {
      let response;

      if (isEditing && selectedTemplateId) {
        // Actualizar template existente
        response = await smsTemplateEndpoints.update(selectedTemplateId, {
          name,
          message,
          category: category as 'promotional' | 'transactional' | 'reminder' | 'alert',
        });
        if (response.success && response.data) {
          toast.success("Template actualizado exitosamente");
          setSavedState({ name, message, category });
          loadTemplates();
          return response.data;
        }
      } else {
        // Crear nuevo template
        response = await smsTemplateEndpoints.create({
          name,
          message,
          category: category as 'promotional' | 'transactional' | 'reminder' | 'alert',
        });
        if (response.success && response.data) {
          toast.success("Template guardado exitosamente");
          setSavedTemplateId(response.data.id);
          setSelectedTemplateId(response.data.id);
          setIsEditing(true);
          setSavedState({ name, message, category });
          loadTemplates();
          return response.data;
        }
      }

      toast.error(response.message || "Error al guardar el template");
      return null;
    } catch (error) {
      toast.error("Error al guardar el template");
      console.error(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar SMS
  const handleSendSms = async () => {
    if (selectedRecipientsMap.size === 0) {
      toast.error("Selecciona al menos un destinatario");
      return;
    }

    if (!message.trim()) {
      toast.error("Por favor escribe un mensaje");
      return;
    }

    setIsSending(true);
    try {
      // Primero guardar el template si no existe
      let templateId = savedTemplateId;
      if (!templateId) {
        const savedTemplate = await handleSave();
        if (!savedTemplate) {
          setIsSending(false);
          return;
        }
        templateId = savedTemplate.id;
      }

      // Preparar destinatarios con variables (nombre y apellido desde la BD)
      // Usamos el Map que guarda los usuarios completos seleccionados
      const selectedUsers = Array.from(selectedRecipientsMap.values());

      const recipientsData = selectedUsers.map((r) => ({
        phoneNumber: r.phone,
        variables: {
          nombre: r.firstName,
          apellido: r.lastName,
        },
      }));

      console.log("[SMS] ===== ENVIO SMS DEBUG =====");
      console.log("[SMS] selectedRecipientsMap size:", selectedRecipientsMap.size);
      console.log("[SMS] Selected recipients IDs:", Array.from(selectedRecipientsMap.keys()));
      console.log("[SMS] All recipients count:", recipients.length);
      console.log("[SMS] All recipients:", recipients.map(r => ({ id: r.id, name: r.name, phone: r.phone })));
      console.log("[SMS] Filtered selectedUsers count:", selectedUsers.length);
      console.log("[SMS] Filtered selectedUsers:", selectedUsers.map(r => ({ id: r.id, name: r.name, phone: r.phone })));
      console.log("[SMS] recipientsData to send count:", recipientsData.length);
      console.log("[SMS] recipientsData to send:", JSON.stringify(recipientsData, null, 2));
      console.log("[SMS] ===========================");

      // Enviar SMS masivo usando el template
      const response = await smsTemplateEndpoints.sendBulk(templateId, recipientsData);

      if (response.success && response.data) {
        const { successful, failed, total } = response.data;
        if (failed === 0) {
          toast.success(`${successful} SMS enviados correctamente`);
        } else if (successful === 0) {
          toast.error(`Error: No se pudo enviar ningún SMS`);
        } else {
          toast.warning(`${successful}/${total} SMS enviados. ${failed} fallaron.`);
        }
        setShowSendDialog(false);
        setSelectedRecipientsMap(new Map());
        // Recargar templates para actualizar estadísticas
        loadTemplates();
      } else {
        toast.error(response.message || "Error al enviar SMS");
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("Error al enviar los SMS");
    } finally {
      setIsSending(false);
    }
  };

  // Enviar a TODOS los destinatarios (backend procesa en lotes)
  const handleSendToAll = async () => {
    if (!message.trim()) {
      toast.error("Por favor escribe un mensaje");
      return;
    }

    setIsSendingToAll(true);
    try {
      // Guardar template si no existe
      let templateId = savedTemplateId;
      if (!templateId) {
        const savedTemplate = await handleSave();
        if (!savedTemplate) {
          setIsSendingToAll(false);
          return;
        }
        templateId = savedTemplate.id;
      }

      const response = await smsTemplateEndpoints.sendToAll(templateId);

      if (response.success && response.data) {
        const { successful, failed, total } = response.data;
        if (failed === 0) {
          toast.success(`${successful.toLocaleString()} SMS enviados correctamente a todos los destinatarios`);
        } else if (successful === 0) {
          toast.error(`Error: No se pudo enviar ningún SMS`);
        } else {
          toast.warning(`${successful.toLocaleString()}/${total.toLocaleString()} SMS enviados. ${failed.toLocaleString()} fallaron.`);
        }
        setShowSendToAllConfirm(false);
        setShowSendDialog(false);
        loadTemplates();
      } else {
        toast.error(response.message || "Error al enviar SMS");
      }
    } catch (error) {
      console.error("Error sending SMS to all:", error);
      toast.error("Error al enviar los SMS");
    } finally {
      setIsSendingToAll(false);
    }
  };

  const progressPercentage = Math.min((characterCount / maxSingle) * 100, 100);
  const nearLimitThreshold = 140;
  const progressColor = characterCount > maxSingle
    ? "bg-orange-500"
    : characterCount > nearLimitThreshold
    ? "bg-yellow-500"
    : "bg-green-500";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/marketing/campaigns")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              {isEditing ? "Editar" : "Crear"} Template SMS
            </h1>
            <p className="text-muted-foreground text-sm">
              {isEditing ? "Modifica tu template existente" : "Crea un template reutilizable para tus campañas de SMS"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button
                variant="outline"
                onClick={handleDeleteTemplate}
                disabled={isLoading}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? "Actualizar" : "Guardar"}
            </Button>
            <Button
              onClick={() => {
                if (hasUnsavedChanges) {
                  setShowUnsavedWarning(true);
                } else {
                  loadRecipients();
                  setShowSendDialog(true);
                }
              }}
              disabled={!message.trim()}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
              Enviar SMS
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-7 gap-6">
          {/* Sidebar de Templates - 2 columnas */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Templates
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={loadTemplates}
                    disabled={isLoadingTemplates}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingTemplates ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={!selectedTemplateId ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleNewTemplate}
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Template
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleSeedTemplates}
                  disabled={isLoading}
                >
                  <Database className="h-4 w-4" />
                  Cargar Por Defecto
                </Button>

                <Separator className="my-2" />

                <ScrollArea className="h-[580px]">
                  <div className="space-y-1 pr-2">
                    {isLoadingTemplates ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : templates.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No hay templates guardados
                      </p>
                    ) : (
                      templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template.id)}
                          className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
                            selectedTemplateId === template.id
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="font-medium truncate">{template.name}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {template.category}
                            </Badge>
                            {template.totalSent > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                {template.totalSent} enviados
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Editor - 3 columnas */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Nombre y Categoría */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Información del Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Template</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Promoción Fin de Semana Samsung"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          category === cat.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-medium text-sm">{cat.label}</div>
                        <div className="text-xs text-muted-foreground">{cat.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editor del Mensaje */}
            <Card className="flex-1">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Mensaje SMS</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isOverLimit ? "destructive" : characterCount > nearLimitThreshold ? "secondary" : "outline"}
                      className="font-mono"
                    >
                      {characterCount}/{maxSingle}
                    </Badge>
                    {segmentCount > 1 && (
                      <Badge variant="secondary">
                        {segmentCount} SMS
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  rows={5}
                  placeholder="Escribe tu mensaje SMS aquí...&#10;&#10;Ejemplo: Hola {{nombre}} {{apellido}}, tenemos ofertas especiales para ti. Visita nuestra tienda!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`text-base resize-none ${isOverLimit ? "border-orange-500 focus-visible:ring-orange-500" : ""}`}
                />

                {/* Barra de progreso */}
                <div className="space-y-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${progressColor}`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {isOverLimit
                        ? `Se enviará como ${segmentCount} SMS concatenados`
                        : `${remainingChars} caracteres restantes`}
                    </span>
                    <span>{segmentCount} segmento{segmentCount > 1 ? "s" : ""}</span>
                  </div>
                </div>

                <Separator />

                {/* Variables */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
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
                        className="h-7 text-xs font-medium"
                      >
                        <Sparkles className="h-3 w-3 mr-1 text-primary" />
                        {variable.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Insertar Link y Emojis */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInsertLink}
                    className="gap-2"
                  >
                    <Link2 className="h-4 w-4" />
                    Insertar Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="gap-2"
                  >
                    <Smile className="h-4 w-4" />
                    Emojis
                  </Button>
                </div>

                {/* Emoji Modal */}
                <Dialog open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Smile className="h-5 w-5" />
                        Seleccionar Emoji
                      </DialogTitle>
                      <DialogDescription>
                        Haz clic en un emoji para insertarlo en tu mensaje.
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[50vh] pr-4">
                      <div className="space-y-4">
                        {EMOJI_CATEGORIES.map((category) => (
                          <div key={category.name}>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                              {category.name}
                            </h4>
                            <div className="grid grid-cols-12 gap-1">
                              {category.emojis.map((emoji: string, index: number) => (
                                <button
                                  key={`${category.name}-${index}`}
                                  type="button"
                                  onClick={() => {
                                    handleInsertEmoji(emoji);
                                    setShowEmojiPicker(false);
                                  }}
                                  className="text-2xl hover:bg-muted p-2 rounded transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                {/* Link Modal */}
                <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Insertar Enlace
                      </DialogTitle>
                      <DialogDescription>
                        Ingresa la URL que deseas agregar al mensaje. Los links ocupan caracteres, considera usar acortadores como bit.ly
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="link-url">URL del enlace</Label>
                        <Input
                          id="link-url"
                          placeholder="https://ejemplo.com"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleConfirmLink();
                            }
                          }}
                          autoFocus
                        />
                        {linkUrl.trim() && (
                          <p className="text-xs text-muted-foreground">
                            Se agregarán {linkUrl.trim().length} caracteres al mensaje
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleConfirmLink} disabled={!linkUrl.trim()}>
                        <Link2 className="h-4 w-4 mr-2" />
                        Insertar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Preview y Stats - 2 columnas */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Preview del teléfono */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Vista Previa</CardTitle>
                <CardDescription>Así se verá tu mensaje en el teléfono</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mx-auto max-w-[260px]">
                  {/* Phone frame */}
                  <div className="bg-gray-900 rounded-[2.5rem] p-2.5 shadow-xl">
                    <div className="bg-black rounded-[2rem] overflow-hidden">
                      {/* Notch */}
                      <div className="h-6 bg-black flex items-center justify-center">
                        <div className="w-16 h-4 bg-black rounded-full" />
                      </div>
                      {/* Screen */}
                      <div className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 min-h-[280px] p-3">
                        {/* SMS Header */}
                        <div className="text-center mb-3">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-1.5">
                            <MessageSquare className="h-5 w-5 text-primary" />
                          </div>
                          <div className="text-xs font-medium">Samsung</div>
                          <div className="text-[10px] text-muted-foreground">SMS</div>
                        </div>

                        {/* Message bubble */}
                        {message ? (
                          <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-tl-sm p-2.5 shadow-sm max-w-[90%]">
                            <p className="text-xs whitespace-pre-wrap break-words leading-relaxed">
                              {getPreviewMessage() || "Tu mensaje aparecerá aquí..."}
                            </p>
                            <div className="text-[9px] text-muted-foreground mt-1.5 text-right">
                              Ahora
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground text-xs py-6">
                            Escribe un mensaje para ver la vista previa
                          </div>
                        )}
                      </div>
                      {/* Home indicator */}
                      <div className="h-6 bg-black flex items-center justify-center">
                        <div className="w-24 h-1 bg-gray-600 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Análisis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2.5 bg-muted/50 rounded-lg">
                    <div className="text-xl font-bold text-primary">{characterCount}</div>
                    <div className="text-xs text-muted-foreground">Caracteres</div>
                  </div>
                  <div className="text-center p-2.5 bg-muted/50 rounded-lg">
                    <div className="text-xl font-bold text-primary">{segmentCount}</div>
                    <div className="text-xs text-muted-foreground">Segmentos</div>
                  </div>
                </div>

                {(() => {
                  const template = isEditing && selectedTemplateId
                    ? templates.find(t => t.id === selectedTemplateId)
                    : null;
                  return (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{template?.totalSent || 0}</div>
                        <div className="text-[10px] text-muted-foreground">Enviados</div>
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{template?.successfulSent || 0}</div>
                        <div className="text-[10px] text-muted-foreground">Exitosos</div>
                      </div>
                      <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <div className="text-lg font-bold text-red-600">{template?.failedSent || 0}</div>
                        <div className="text-[10px] text-muted-foreground">Fallidos</div>
                      </div>
                    </div>
                  );
                })()}

                <Separator />

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Variables:</span>
                    {variablesUsed.length > 0 ? (
                      variablesUsed.map((v) => (
                        <Badge key={v.value} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {v.label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Ninguna</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Costo por mensaje:</span>
                  <span className="font-medium">~${(segmentCount * 0.02).toFixed(2)} USD</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Dialog de cambios sin guardar */}
      <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-500">
              <AlertTriangle className="h-5 w-5" />
              Cambios sin guardar
            </DialogTitle>
            <DialogDescription>
              Has modificado el template pero no has guardado los cambios. El SMS se enviará con la versión guardada anteriormente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUnsavedWarning(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowUnsavedWarning(false);
                loadRecipients();
                setShowSendDialog(true);
              }}
            >
              Enviar sin actualizar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={async () => {
                const saved = await handleSave();
                if (saved) {
                  setShowUnsavedWarning(false);
                  loadRecipients();
                  setShowSendDialog(true);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Actualizar y Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de envío de SMS */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="!max-w-3xl h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Enviar SMS
            </DialogTitle>
            <DialogDescription>
              Selecciona los destinatarios para enviar tu mensaje SMS
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Info del mensaje + total destinatarios */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase font-medium">Mensaje a enviar</p>
                <p className="font-medium truncate">
                  {name || "Sin nombre"} - {characterCount} caracteres ({segmentCount} SMS)
                </p>
              </div>
              <Badge variant={category === "transactional" ? "default" : "secondary"}>
                {CATEGORIES.find(c => c.value === category)?.label}
              </Badge>
            </div>

            {/* Total de destinatarios + Enviar a todos */}
            {recipientsTotal > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="h-10 w-10 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg text-blue-600">{recipientsTotal.toLocaleString()} destinatarios</p>
                </div>
                <Button
                  onClick={() => setShowSendToAllConfirm(true)}
                  disabled={isSendingToAll || !message.trim()}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                  Enviar a todos
                </Button>
              </div>
            )}

            {/* Buscador y controles */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono (ej: 3150004...)"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      loadRecipients(recipientSearch);
                    }
                  }}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadRecipients(recipientSearch)}
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
                    ["Nombre", "Teléfono", "Email"].join(","),
                    ...recipients.map(r => [`"${r.name.replace(/"/g, '""')}"`, `"${r.phone}"`, `"${r.email || ""}"`].join(","))
                  ].join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `destinatarios-sms-${new Date().toISOString().split("T")[0]}.csv`;
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

            {/* Resumen de costos */}
            {selectedRecipientsMap.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                <div className="text-sm">
                  <span className="text-muted-foreground">Costo estimado total:</span>
                  <span className="font-bold text-green-600 ml-2">
                    ~${(selectedRecipientsMap.size * segmentCount * 0.02).toFixed(2)} USD
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedRecipientsMap.size} destinatarios × {segmentCount} SMS × $0.02
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowSendDialog(false);
                setSelectedRecipientsMap(new Map());
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendSms}
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
      <Dialog open={showSendToAllConfirm} onOpenChange={setShowSendToAllConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Users className="h-5 w-5" />
              Enviar a todos los destinatarios
            </DialogTitle>
            <DialogDescription>
              Se enviará el SMS a <strong>{recipientsTotal.toLocaleString()}</strong> destinatarios.
              El envío se procesará en lotes de 500 en el servidor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex justify-between text-sm p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Total destinatarios:</span>
              <span className="font-bold">{recipientsTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Segmentos por SMS:</span>
              <span className="font-bold">{segmentCount}</span>
            </div>
            <div className="flex justify-between text-sm p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900">
              <span className="text-muted-foreground">Costo estimado:</span>
              <span className="font-bold text-orange-600">
                ~${(recipientsTotal * segmentCount * 0.02).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
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
              disabled={isSendingToAll}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSendingToAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando a {recipientsTotal.toLocaleString()}...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Confirmar envío a {recipientsTotal.toLocaleString()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
