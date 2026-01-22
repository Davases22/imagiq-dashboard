"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Send,
  Users,
  Mail,
  Search,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { emailEndpoints, stripoEndpoints, EmailTemplate } from "@/lib/api";
import { LayoutTemplate } from "lucide-react";

export interface EmailUser {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  cedula?: string;
  celular?: string;
}

interface SendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  htmlContent?: string;
  templateName?: string;
  defaultSubject?: string;
}

const SENDER_OPTIONS = [
  { value: "hola@imagiq.com", label: "Hola - hola@imagiq.com" },
  { value: "promociones@imagiq.com", label: "Promociones - promociones@imagiq.com" },
  { value: "contacto@imagiq.com", label: "Contacto - contacto@imagiq.com" },
  { value: "noreply@imagiq.com", label: "No Reply - noreply@imagiq.com" },
  { value: "soporte@imagiq.com", label: "Soporte - soporte@imagiq.com" },
];

export function SendEmailModal({
  open,
  onOpenChange,
  htmlContent,
  templateName,
  defaultSubject,
}: SendEmailModalProps) {
  const [users, setUsers] = useState<EmailUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [subject, setSubject] = useState(defaultSubject || "");
  const [fromEmail, setFromEmail] = useState("hola@imagiq.com");
  const [fromName, setFromName] = useState("ImagiQ");
  const [manualEmails, setManualEmails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "manual">("users");

  // Template selection state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedTemplateHtml, setSelectedTemplateHtml] = useState<string>("");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Load users and templates when modal opens
  useEffect(() => {
    if (open) {
      loadUsers();
      loadTemplates();
      if (defaultSubject) {
        setSubject(defaultSubject);
      }
      // If htmlContent is provided, use it directly
      if (htmlContent) {
        setSelectedTemplateHtml(htmlContent);
        setSelectedTemplateId("");
      }
    }
  }, [open, defaultSubject, htmlContent]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await emailEndpoints.getUsers();
      // Handle both wrapped response { success, data } and direct array response
      if (Array.isArray(response)) {
        setUsers(response);
      } else if (response.success && response.data) {
        setUsers(response.data);
      } else if (Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await stripoEndpoints.listTemplates({});
      console.log("Templates response:", response);
      if (response.success && response.data) {
        console.log("Templates loaded:", response.data);
        setTemplates(response.data);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Error al cargar plantillas");
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = async (templateId: string) => {
    if (!templateId) {
      setSelectedTemplateId("");
      setSelectedTemplateHtml(htmlContent || "");
      setSubject(defaultSubject || "");
      return;
    }

    // If selecting current editor design
    if (templateId === "current") {
      setSelectedTemplateId("current");
      setSelectedTemplateHtml(htmlContent || "");
      if (defaultSubject) {
        setSubject(defaultSubject);
      }
      return;
    }

    setSelectedTemplateId(templateId);
    try {
      const response = await stripoEndpoints.getTemplate(templateId);
      if (response.success && response.data) {
        const template = response.data;
        // Use htmlContent (compiled with inline styles) for sending emails
        // designJson.html is for editing, not sending
        const html = template.htmlContent;
        setSelectedTemplateHtml(html || "");
        // Also update subject if template has one
        if (template.subject) {
          setSubject(template.subject);
        }
      }
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Error al cargar plantilla");
    }
  };

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    const userList = Array.isArray(users) ? users : [];
    if (!searchQuery.trim()) return userList;
    const query = searchQuery.toLowerCase();
    return userList.filter(
      (user) =>
        user.nombre?.toLowerCase().includes(query) ||
        user.apellido?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.cedula?.toLowerCase().includes(query) ||
        user.celular?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Toggle user selection
  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Select all filtered users
  const selectAll = () => {
    const newSet = new Set(selectedUserIds);
    filteredUsers.forEach((user) => newSet.add(user.id));
    setSelectedUserIds(newSet);
  };

  // Deselect all filtered users
  const deselectAll = () => {
    const newSet = new Set(selectedUserIds);
    filteredUsers.forEach((user) => newSet.delete(user.id));
    setSelectedUserIds(newSet);
  };

  // Get selected users
  const selectedUsers = useMemo(() => {
    const userList = Array.isArray(users) ? users : [];
    return userList.filter((user) => selectedUserIds.has(user.id));
  }, [users, selectedUserIds]);

  // Parse manual emails
  const parseManualEmails = (): string[] => {
    if (!manualEmails.trim()) return [];
    return manualEmails
      .split(/[,;\n]/)
      .map((email) => email.trim())
      .filter((email) => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  };

  // Get all recipient emails (for count display)
  const getAllRecipientEmails = (): string[] => {
    const userEmails = selectedUsers.map((u) => u.email);
    const manual = parseManualEmails();
    return [...new Set([...userEmails, ...manual])];
  };

  // Get all recipients in the format expected by the backend
  const getAllRecipients = () => {
    // From selected users - include name
    const fromUsers = selectedUsers.map((u) => ({
      email: u.email,
      name: `${u.nombre} ${u.apellido}`.trim() || undefined,
    }));

    // From manual emails - just email
    const fromManual = parseManualEmails().map((email) => ({
      email,
    }));

    // Combine and deduplicate by email
    const allRecipients = [...fromUsers, ...fromManual];
    const uniqueEmails = new Set<string>();
    return allRecipients.filter((r) => {
      if (uniqueEmails.has(r.email)) return false;
      uniqueEmails.add(r.email);
      return true;
    });
  };

  // Handle send
  const handleSend = async () => {
    const recipients = getAllRecipients();

    if (recipients.length === 0) {
      toast.error("Selecciona al menos un destinatario");
      return;
    }

    if (!subject.trim()) {
      toast.error("El asunto es requerido");
      return;
    }

    const emailContent = selectedTemplateHtml || htmlContent;
    if (!emailContent) {
      toast.error("Selecciona una plantilla para enviar");
      return;
    }

    setIsSending(true);

    // Log detallado de la petición
    const requestData = {
      recipients,
      subject,
      htmlContent: emailContent,
      fromEmail,
      fromName,
    };
    console.log("📧 === ENVIANDO EMAIL ===");
    console.log("📧 Recipients:", recipients);
    console.log("📧 Subject:", subject);
    console.log("📧 From:", fromEmail, "-", fromName);
    console.log("📧 HTML Content length:", emailContent?.length || 0);
    console.log("📧 Full request:", requestData);

    try {
      const response = await emailEndpoints.sendBulk(requestData);

      console.log("📧 === RESPUESTA ===");
      console.log("📧 Response:", response);
      console.log("📧 Success:", response.success);
      console.log("📧 Data:", response.data);

      if (response.success) {
        toast.success(`Email enviado a ${recipients.length} destinatario(s)`);
        onOpenChange(false);
        // Reset state
        setSelectedUserIds(new Set());
        setManualEmails("");
      } else {
        console.error("📧 Error response:", response);
        toast.error(response.message || "Error al enviar emails");
      }
    } catch (error) {
      console.error("📧 === ERROR ===");
      console.error("📧 Error completo:", error);
      console.error("📧 Error message:", error instanceof Error ? error.message : "Unknown");
      console.error("📧 Error stack:", error instanceof Error ? error.stack : "N/A");
      toast.error("Error al enviar emails");
    } finally {
      setIsSending(false);
    }
  };

  const totalRecipients = getAllRecipientEmails().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[700px] w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Email
          </DialogTitle>
          <DialogDescription>
            {templateName
              ? `Enviar plantilla "${templateName}"`
              : "Selecciona los destinatarios y configura el envío"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label htmlFor="template" className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Plantilla *
            </Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
              <SelectTrigger className={!selectedTemplateHtml && !selectedTemplateId ? "border-destructive" : ""}>
                <SelectValue placeholder={isLoadingTemplates ? "Cargando plantillas..." : "Selecciona una plantilla"} />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[9999]">
                {htmlContent && (
                  <SelectItem value="current">
                    Diseño actual del editor
                  </SelectItem>
                )}
                {templates.length === 0 && !isLoadingTemplates && (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No hay plantillas guardadas
                  </div>
                )}
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && !isLoadingTemplates && (
              <p className="text-xs text-muted-foreground">
                No hay plantillas guardadas. Guarda una plantilla primero.
              </p>
            )}
          </div>

          {/* Subject and From */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto *</Label>
              <Input
                id="subject"
                placeholder="Asunto del email"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from">Remitente</Label>
              <Select value={fromEmail} onValueChange={setFromEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar remitente" />
                </SelectTrigger>
                <SelectContent>
                  {SENDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromName">Nombre del remitente</Label>
            <Input
              id="fromName"
              placeholder="ImagiQ"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("users")}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Usuarios ({users.length})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "manual"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("manual")}
            >
              <Mail className="h-4 w-4 inline mr-2" />
              Emails manuales
            </button>
          </div>

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              {/* Search and actions */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Todos
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  <Square className="h-4 w-4 mr-1" />
                  Ninguno
                </Button>
              </div>

              {/* Selected count */}
              {selectedUserIds.size > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">
                    {selectedUserIds.size} seleccionado(s)
                  </Badge>
                  <button
                    className="text-destructive hover:underline"
                    onClick={() => setSelectedUserIds(new Set())}
                  >
                    Limpiar selección
                  </button>
                </div>
              )}

              {/* User list */}
              <ScrollArea className="flex-1 border rounded-md max-h-[250px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No se encontraron usuarios" : "No hay usuarios"}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedUserIds.has(user.id)}
                          onCheckedChange={() => toggleUser(user.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.nombre} {user.apellido}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                          {(user.cedula || user.celular) && (
                            <p className="text-xs text-muted-foreground truncate">
                              {user.cedula && <span>Cédula: {user.cedula}</span>}
                              {user.cedula && user.celular && <span> • </span>}
                              {user.celular && <span>Cel: {user.celular}</span>}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Manual Tab */}
          {activeTab === "manual" && (
            <div className="space-y-3">
              <Label htmlFor="manualEmails">
                Emails adicionales (separados por coma, punto y coma, o nueva línea)
              </Label>
              <textarea
                id="manualEmails"
                className="w-full h-[200px] p-3 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="email1@ejemplo.com, email2@ejemplo.com&#10;email3@ejemplo.com"
                value={manualEmails}
                onChange={(e) => setManualEmails(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {parseManualEmails().length} email(s) válido(s) ingresado(s)
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              <Mail className="h-4 w-4 inline mr-1" />
              {totalRecipients} destinatario(s) total
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending || totalRecipients === 0 || !subject.trim() || (!selectedTemplateHtml && !htmlContent)}
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar ({totalRecipients})
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
