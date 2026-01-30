"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// GrapesJS styles
import "grapesjs/dist/css/grapes.min.css";
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
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { EmailTemplate, stripoEndpoints } from "@/lib/api";
import type { Editor } from "grapesjs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Recipient {
  id: string;
  name: string;
  email: string;
}

interface GrapesJSEmailEditorProps {
  templateId?: string;
  onBack?: () => void;
  onSaved?: (template: EmailTemplate) => void;
}

export function GrapesJSEmailEditor({
  templateId,
  onBack,
  onSaved,
}: GrapesJSEmailEditorProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isLoading, setIsLoading] = useState(!!templateId);
  const [grapesjs, setGrapesjs] = useState<typeof import("grapesjs").default | null>(null);
  const [GjsEditor, setGjsEditor] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    const loadGrapesJS = async () => {
      const [gjsModule, gjsReactModule, newsletterPlugin] = await Promise.all([
        import("grapesjs"),
        import("@grapesjs/react"),
        import("grapesjs-preset-newsletter"),
      ]);
      setGrapesjs(() => gjsModule.default);
      setGjsEditor(() => gjsReactModule.default);

      // Register the plugin
      gjsModule.default.plugins.add("grapesjs-preset-newsletter", newsletterPlugin.default);
    };
    loadGrapesJS();
  }, []);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [currentTemplateId, setCurrentTemplateId] = useState<string | undefined>(templateId);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Estados para envío de emails
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [recipientSearch, setRecipientSearch] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");

  // Cargar templates guardados (template + samsung)
  const loadSavedTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      // Cargar templates predefinidos y templates de Samsung
      const [templatesResponse, samsungResponse] = await Promise.all([
        stripoEndpoints.listTemplates({ category: "template" }),
        stripoEndpoints.listTemplates({ category: "samsung" }),
      ]);

      const allTemplates: EmailTemplate[] = [];
      if (templatesResponse.success && templatesResponse.data) {
        allTemplates.push(...templatesResponse.data);
      }
      if (samsungResponse.success && samsungResponse.data) {
        allTemplates.push(...samsungResponse.data);
      }
      setSavedTemplates(allTemplates);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  // Estado para carga de destinatarios
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  // Cargar destinatarios desde la base de datos
  const loadRecipients = useCallback(async (search?: string) => {
    setIsLoadingRecipients(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/campaigns/recipients?limit=200${search ? `&search=${encodeURIComponent(search)}` : ""}`,
        {
          headers: {
            "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const recipientsList: Recipient[] = (data.users || []).map((user: { id: string; nombre: string; apellido: string; email: string }) => ({
          id: user.id,
          name: `${user.nombre || ""} ${user.apellido || ""}`.trim() || user.email,
          email: user.email,
        }));
        setRecipients(recipientsList);
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

  // Los destinatarios ya vienen filtrados del servidor
  const filteredRecipients = recipients;

  // Toggle selección de destinatario
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

  // Seleccionar todos los destinatarios filtrados
  const selectAllRecipients = () => {
    const allIds = filteredRecipients.map((r) => r.id);
    setSelectedRecipients(new Set(allIds));
  };

  // Deseleccionar todos
  const deselectAllRecipients = () => {
    setSelectedRecipients(new Set());
  };

  // Enviar emails
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
      const { html } = exportHtml();
      const selectedEmails = recipients
        .filter((r) => selectedRecipients.has(r.id))
        .map((r) => ({ email: r.email, name: r.name }));

      // Enviar emails uno por uno (en producción se usaría un endpoint de envío masivo)
      let successCount = 0;
      let failCount = 0;

      for (const recipient of selectedEmails) {
        try {
          // Llamar al endpoint de envío de email
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/messaging/send-campaign-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
              },
              body: JSON.stringify({
                to: recipient.email,
                subject: emailSubject,
                html: html,
                recipientName: recipient.name,
              }),
            }
          );

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} email(s) enviado(s) correctamente`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} email(s) fallaron al enviar`);
      }

      setShowSendDialog(false);
      setSelectedRecipients(new Set());
      setEmailSubject("");
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error("Error al enviar los emails");
    } finally {
      setIsSending(false);
    }
  };

  // Aplicar template seleccionado al editor
  const applyTemplate = useCallback((template: EmailTemplate) => {
    if (!editor) return;

    const designJson = template.designJson as {
      templateType?: string;
      grapesJSData?: { html: string; css: string; components?: string; styles?: string };
    } | undefined;

    if (designJson?.templateType === "grapesjs" && designJson.grapesJSData) {
      if (designJson.grapesJSData.components) {
        editor.setComponents(JSON.parse(designJson.grapesJSData.components));
      } else if (designJson.grapesJSData.html) {
        editor.setComponents(designJson.grapesJSData.html);
      }
      if (designJson.grapesJSData.styles) {
        editor.setStyle(JSON.parse(designJson.grapesJSData.styles));
      } else if (designJson.grapesJSData.css) {
        editor.setStyle(designJson.grapesJSData.css);
      }
    } else if (template.htmlContent) {
      editor.setComponents(template.htmlContent);
    }

    setShowTemplatesDialog(false);
    toast.success(`Template "${template.name}" aplicado`);
  }, [editor]);

  const onEditorReady = useCallback(async (editorInstance: Editor) => {
    setEditor(editorInstance);

    // Add e-commerce email templates
    const bm = editorInstance.Blocks;

    // Template: Promotional Sale
    bm.add("template-promo-sale", {
      label: "Promocion Venta",
      category: "Templates E-commerce",
      content: `
        <table style="width:100%;max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
          <tr>
            <td style="background:#6366f1;padding:30px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:28px;">OFERTA ESPECIAL</h1>
              <p style="color:#e0e7ff;margin:10px 0 0;font-size:16px;">Solo por tiempo limitado</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;background:#fff;">
              <h2 style="color:#1f2937;margin:0 0 15px;font-size:24px;text-align:center;">Hasta 50% de Descuento</h2>
              <p style="color:#6b7280;margin:0 0 25px;font-size:16px;line-height:1.6;text-align:center;">Aprovecha nuestras increíbles ofertas en productos seleccionados. ¡No te lo pierdas!</p>
              <table style="width:100%;margin-bottom:25px;">
                <tr>
                  <td style="width:50%;padding:10px;vertical-align:top;">
                    <div style="background:#f9fafb;border-radius:8px;padding:15px;text-align:center;">
                      <img src="https://placehold.co/200x200/e5e7eb/9ca3af?text=Producto+1" style="max-width:100%;border-radius:8px;"/>
                      <h3 style="color:#1f2937;margin:15px 0 5px;font-size:16px;">Producto Destacado</h3>
                      <p style="color:#6366f1;font-weight:bold;margin:0;font-size:18px;">$99.99</p>
                      <p style="color:#9ca3af;text-decoration:line-through;margin:5px 0;font-size:14px;">$199.99</p>
                    </div>
                  </td>
                  <td style="width:50%;padding:10px;vertical-align:top;">
                    <div style="background:#f9fafb;border-radius:8px;padding:15px;text-align:center;">
                      <img src="https://placehold.co/200x200/e5e7eb/9ca3af?text=Producto+2" style="max-width:100%;border-radius:8px;"/>
                      <h3 style="color:#1f2937;margin:15px 0 5px;font-size:16px;">Producto Destacado</h3>
                      <p style="color:#6366f1;font-weight:bold;margin:0;font-size:18px;">$149.99</p>
                      <p style="color:#9ca3af;text-decoration:line-through;margin:5px 0;font-size:14px;">$299.99</p>
                    </div>
                  </td>
                </tr>
              </table>
              <div style="text-align:center;">
                <a href="#" style="display:inline-block;background:#6366f1;color:#fff;padding:15px 40px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Ver Todas las Ofertas</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#1f2937;padding:25px;text-align:center;">
              <p style="color:#9ca3af;margin:0;font-size:14px;">© 2024 Tu Empresa. Todos los derechos reservados.</p>
              <p style="margin:10px 0 0;"><a href="#" style="color:#6366f1;text-decoration:none;font-size:14px;">Cancelar suscripción</a></p>
            </td>
          </tr>
        </table>
      `,
    });

    // Template: New Product Launch
    bm.add("template-new-product", {
      label: "Nuevo Producto",
      category: "Templates E-commerce",
      content: `
        <table style="width:100%;max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px;text-align:center;">
              <p style="color:#e0e7ff;margin:0 0 10px;font-size:14px;text-transform:uppercase;letter-spacing:2px;">Recién Llegado</p>
              <h1 style="color:#fff;margin:0;font-size:32px;">Nuevo Producto</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0;background:#fff;">
              <img src="https://placehold.co/600x400/f3f4f6/9ca3af?text=Imagen+del+Producto" style="width:100%;display:block;"/>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;background:#fff;text-align:center;">
              <h2 style="color:#1f2937;margin:0 0 15px;font-size:26px;">Nombre del Producto</h2>
              <p style="color:#6b7280;margin:0 0 20px;font-size:16px;line-height:1.6;">Descripción breve del producto. Destaca las características principales y beneficios que ofrece a tus clientes.</p>
              <p style="color:#667eea;font-size:32px;font-weight:bold;margin:0 0 25px;">$299.99</p>
              <a href="#" style="display:inline-block;background:#667eea;color:#fff;padding:15px 50px;text-decoration:none;border-radius:50px;font-weight:bold;font-size:16px;">Comprar Ahora</a>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:30px;">
              <h3 style="color:#1f2937;margin:0 0 20px;font-size:18px;text-align:center;">Características Principales</h3>
              <table style="width:100%;">
                <tr>
                  <td style="padding:10px;text-align:center;width:33%;">
                    <div style="font-size:24px;margin-bottom:10px;">✨</div>
                    <p style="color:#4b5563;margin:0;font-size:14px;">Alta Calidad</p>
                  </td>
                  <td style="padding:10px;text-align:center;width:33%;">
                    <div style="font-size:24px;margin-bottom:10px;">🚚</div>
                    <p style="color:#4b5563;margin:0;font-size:14px;">Envío Gratis</p>
                  </td>
                  <td style="padding:10px;text-align:center;width:33%;">
                    <div style="font-size:24px;margin-bottom:10px;">🔄</div>
                    <p style="color:#4b5563;margin:0;font-size:14px;">30 Días Garantía</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#1f2937;padding:25px;text-align:center;">
              <p style="color:#9ca3af;margin:0;font-size:14px;">© 2024 Tu Empresa. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      `,
    });

    // Template: Welcome Email
    bm.add("template-welcome", {
      label: "Bienvenida",
      category: "Templates E-commerce",
      content: `
        <table style="width:100%;max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
          <tr>
            <td style="background:#10b981;padding:50px 30px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:32px;">¡Bienvenido!</h1>
              <p style="color:#d1fae5;margin:15px 0 0;font-size:18px;">Gracias por unirte a nuestra comunidad</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;background:#fff;">
              <p style="color:#1f2937;margin:0 0 20px;font-size:18px;">Hola <strong>[Nombre]</strong>,</p>
              <p style="color:#6b7280;margin:0 0 25px;font-size:16px;line-height:1.7;">Estamos emocionados de tenerte con nosotros. A partir de ahora, serás el primero en enterarte de nuestras ofertas exclusivas, nuevos productos y promociones especiales.</p>
              <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:20px;margin:0 0 25px;border-radius:0 8px 8px 0;">
                <p style="color:#065f46;margin:0;font-size:16px;font-weight:bold;">🎁 Regalo de Bienvenida</p>
                <p style="color:#047857;margin:10px 0 0;font-size:14px;">Usa el código <strong>BIENVENIDO15</strong> y obtén 15% de descuento en tu primera compra.</p>
              </div>
              <div style="text-align:center;">
                <a href="#" style="display:inline-block;background:#10b981;color:#fff;padding:15px 40px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Explorar Tienda</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:30px;text-align:center;">
              <p style="color:#6b7280;margin:0 0 15px;font-size:14px;">Síguenos en redes sociales</p>
              <p style="margin:0;">
                <a href="#" style="display:inline-block;margin:0 10px;color:#6b7280;text-decoration:none;">Facebook</a>
                <a href="#" style="display:inline-block;margin:0 10px;color:#6b7280;text-decoration:none;">Instagram</a>
                <a href="#" style="display:inline-block;margin:0 10px;color:#6b7280;text-decoration:none;">Twitter</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#1f2937;padding:25px;text-align:center;">
              <p style="color:#9ca3af;margin:0;font-size:14px;">© 2024 Tu Empresa. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      `,
    });

    // Template: Abandoned Cart
    bm.add("template-abandoned-cart", {
      label: "Carrito Abandonado",
      category: "Templates E-commerce",
      content: `
        <table style="width:100%;max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
          <tr>
            <td style="background:#f59e0b;padding:30px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:26px;">🛒 ¡Olvidaste algo!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;background:#fff;">
              <p style="color:#1f2937;margin:0 0 20px;font-size:18px;">Hola <strong>[Nombre]</strong>,</p>
              <p style="color:#6b7280;margin:0 0 30px;font-size:16px;line-height:1.6;">Notamos que dejaste algunos productos en tu carrito. ¡No te preocupes! Los guardamos para ti.</p>

              <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:20px;margin:0 0 30px;">
                <table style="width:100%;">
                  <tr>
                    <td style="width:80px;vertical-align:top;">
                      <img src="https://placehold.co/80x80/e5e7eb/9ca3af?text=Prod" style="border-radius:8px;"/>
                    </td>
                    <td style="padding-left:15px;vertical-align:top;">
                      <h3 style="color:#1f2937;margin:0 0 5px;font-size:16px;">Nombre del Producto</h3>
                      <p style="color:#6b7280;margin:0 0 5px;font-size:14px;">Cantidad: 1</p>
                      <p style="color:#f59e0b;margin:0;font-size:18px;font-weight:bold;">$149.99</p>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="text-align:center;margin-bottom:30px;">
                <a href="#" style="display:inline-block;background:#f59e0b;color:#fff;padding:15px 40px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Completar Compra</a>
              </div>

              <div style="background:#fef3c7;padding:15px;border-radius:8px;text-align:center;">
                <p style="color:#92400e;margin:0;font-size:14px;">⏰ Tu carrito expira en <strong>24 horas</strong></p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#1f2937;padding:25px;text-align:center;">
              <p style="color:#9ca3af;margin:0;font-size:14px;">© 2024 Tu Empresa. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      `,
    });

    // Template: Order Confirmation
    bm.add("template-order-confirmation", {
      label: "Confirmación Pedido",
      category: "Templates E-commerce",
      content: `
        <table style="width:100%;max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
          <tr>
            <td style="background:#059669;padding:30px;text-align:center;">
              <div style="font-size:48px;margin-bottom:15px;">✓</div>
              <h1 style="color:#fff;margin:0;font-size:26px;">¡Pedido Confirmado!</h1>
              <p style="color:#d1fae5;margin:10px 0 0;font-size:16px;">Orden #12345678</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;background:#fff;">
              <p style="color:#1f2937;margin:0 0 25px;font-size:16px;line-height:1.6;">Gracias por tu compra. Hemos recibido tu pedido y lo estamos procesando. Te enviaremos un correo cuando sea enviado.</p>

              <h3 style="color:#1f2937;margin:0 0 15px;font-size:18px;border-bottom:2px solid #e5e7eb;padding-bottom:10px;">Resumen del Pedido</h3>

              <table style="width:100%;margin-bottom:25px;">
                <tr>
                  <td style="padding:15px 0;border-bottom:1px solid #e5e7eb;">
                    <table style="width:100%;">
                      <tr>
                        <td style="width:60px;vertical-align:top;">
                          <img src="https://placehold.co/60x60/e5e7eb/9ca3af?text=1" style="border-radius:4px;"/>
                        </td>
                        <td style="padding-left:15px;vertical-align:top;">
                          <p style="color:#1f2937;margin:0;font-size:14px;font-weight:bold;">Producto 1</p>
                          <p style="color:#6b7280;margin:5px 0 0;font-size:13px;">Cantidad: 1</p>
                        </td>
                        <td style="text-align:right;vertical-align:top;">
                          <p style="color:#1f2937;margin:0;font-size:14px;font-weight:bold;">$99.99</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:15px 0;border-bottom:1px solid #e5e7eb;">
                    <table style="width:100%;">
                      <tr>
                        <td style="width:60px;vertical-align:top;">
                          <img src="https://placehold.co/60x60/e5e7eb/9ca3af?text=2" style="border-radius:4px;"/>
                        </td>
                        <td style="padding-left:15px;vertical-align:top;">
                          <p style="color:#1f2937;margin:0;font-size:14px;font-weight:bold;">Producto 2</p>
                          <p style="color:#6b7280;margin:5px 0 0;font-size:13px;">Cantidad: 2</p>
                        </td>
                        <td style="text-align:right;vertical-align:top;">
                          <p style="color:#1f2937;margin:0;font-size:14px;font-weight:bold;">$149.99</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table style="width:100%;background:#f9fafb;border-radius:8px;padding:15px;">
                <tr>
                  <td style="padding:8px 15px;"><span style="color:#6b7280;font-size:14px;">Subtotal</span></td>
                  <td style="padding:8px 15px;text-align:right;"><span style="color:#1f2937;font-size:14px;">$249.98</span></td>
                </tr>
                <tr>
                  <td style="padding:8px 15px;"><span style="color:#6b7280;font-size:14px;">Envío</span></td>
                  <td style="padding:8px 15px;text-align:right;"><span style="color:#059669;font-size:14px;">Gratis</span></td>
                </tr>
                <tr>
                  <td style="padding:8px 15px;border-top:2px solid #e5e7eb;"><span style="color:#1f2937;font-size:16px;font-weight:bold;">Total</span></td>
                  <td style="padding:8px 15px;border-top:2px solid #e5e7eb;text-align:right;"><span style="color:#059669;font-size:18px;font-weight:bold;">$249.98</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:25px 30px;">
              <h3 style="color:#1f2937;margin:0 0 15px;font-size:16px;">Dirección de Envío</h3>
              <p style="color:#6b7280;margin:0;font-size:14px;line-height:1.6;">
                [Nombre del Cliente]<br/>
                [Dirección]<br/>
                [Ciudad, Estado, CP]
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#1f2937;padding:25px;text-align:center;">
              <p style="color:#9ca3af;margin:0;font-size:14px;">© 2024 Tu Empresa. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      `,
    });

    // Template: Newsletter
    bm.add("template-newsletter", {
      label: "Newsletter",
      category: "Templates E-commerce",
      content: `
        <table style="width:100%;max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
          <tr>
            <td style="background:#1f2937;padding:25px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">Tu Empresa</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              <img src="https://placehold.co/600x300/6366f1/ffffff?text=Newsletter+Header" style="width:100%;display:block;"/>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;background:#fff;">
              <h2 style="color:#1f2937;margin:0 0 20px;font-size:24px;">Las Novedades de Esta Semana</h2>
              <p style="color:#6b7280;margin:0 0 30px;font-size:16px;line-height:1.7;">Descubre las últimas noticias, tendencias y ofertas exclusivas que tenemos para ti. ¡No te pierdas nada!</p>

              <div style="margin-bottom:30px;">
                <table style="width:100%;">
                  <tr>
                    <td style="width:40%;vertical-align:top;">
                      <img src="https://placehold.co/200x150/e5e7eb/9ca3af?text=Articulo+1" style="width:100%;border-radius:8px;"/>
                    </td>
                    <td style="width:60%;padding-left:20px;vertical-align:top;">
                      <h3 style="color:#1f2937;margin:0 0 10px;font-size:18px;">Título del Artículo</h3>
                      <p style="color:#6b7280;margin:0 0 15px;font-size:14px;line-height:1.5;">Breve descripción del artículo o noticia que quieres compartir con tus suscriptores.</p>
                      <a href="#" style="color:#6366f1;font-size:14px;font-weight:bold;text-decoration:none;">Leer más →</a>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="margin-bottom:30px;">
                <table style="width:100%;">
                  <tr>
                    <td style="width:40%;vertical-align:top;">
                      <img src="https://placehold.co/200x150/e5e7eb/9ca3af?text=Articulo+2" style="width:100%;border-radius:8px;"/>
                    </td>
                    <td style="width:60%;padding-left:20px;vertical-align:top;">
                      <h3 style="color:#1f2937;margin:0 0 10px;font-size:18px;">Otro Artículo Interesante</h3>
                      <p style="color:#6b7280;margin:0 0 15px;font-size:14px;line-height:1.5;">Otra descripción breve para mantener a tus lectores interesados en tu contenido.</p>
                      <a href="#" style="color:#6366f1;font-size:14px;font-weight:bold;text-decoration:none;">Leer más →</a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#6366f1;padding:30px;text-align:center;">
              <h3 style="color:#fff;margin:0 0 15px;font-size:20px;">¿Te gustó nuestro contenido?</h3>
              <a href="#" style="display:inline-block;background:#fff;color:#6366f1;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">Visitar Tienda</a>
            </td>
          </tr>
          <tr>
            <td style="background:#1f2937;padding:25px;text-align:center;">
              <p style="color:#9ca3af;margin:0 0 10px;font-size:14px;">© 2024 Tu Empresa. Todos los derechos reservados.</p>
              <p style="margin:0;"><a href="#" style="color:#6366f1;text-decoration:none;font-size:14px;">Cancelar suscripción</a></p>
            </td>
          </tr>
        </table>
      `,
    });

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

          const designJson = template.designJson as {
            templateType?: string;
            grapesJSData?: { html: string; css: string; components?: string; styles?: string };
          } | undefined;

          if (designJson?.templateType === "grapesjs" && designJson.grapesJSData) {
            if (designJson.grapesJSData.components) {
              editorInstance.setComponents(JSON.parse(designJson.grapesJSData.components));
            } else if (designJson.grapesJSData.html) {
              editorInstance.setComponents(designJson.grapesJSData.html);
            }
            if (designJson.grapesJSData.styles) {
              editorInstance.setStyle(JSON.parse(designJson.grapesJSData.styles));
            } else if (designJson.grapesJSData.css) {
              editorInstance.setStyle(designJson.grapesJSData.css);
            }
          } else if (template.htmlContent) {
            editorInstance.setComponents(template.htmlContent);
          }
        }
      } catch {
        toast.error("Error al cargar la plantilla");
      } finally {
        setIsLoading(false);
      }
    }
  }, [templateId]);

  const exportHtml = (): { html: string; css: string; components: string; styles: string } => {
    if (!editor) {
      throw new Error("Editor not ready");
    }

    const html = editor.getHtml();
    const css = editor.getCss() || "";
    const components = JSON.stringify(editor.getComponents());
    const styles = JSON.stringify(editor.getStyle());

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${css}</style>
</head>
<body>
  ${html}
</body>
</html>`;

    return { html: fullHtml, css, components, styles };
  };

  const handleSave = () => {
    if (currentTemplateId) {
      handleUpdateTemplate();
    } else {
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
      const { html, css, components, styles } = exportHtml();

      const saveResponse = await stripoEndpoints.saveTemplate({
        name: templateName,
        subject: templateSubject,
        htmlContent: html,
        designJson: {
          templateType: "grapesjs",
          grapesJSData: { html, css, components, styles },
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
      const { html, css, components, styles } = exportHtml();

      const updateResponse = await stripoEndpoints.updateTemplate(currentTemplateId, {
        name: templateName || undefined,
        subject: templateSubject || undefined,
        htmlContent: html,
        designJson: {
          templateType: "grapesjs",
          grapesJSData: { html, css, components, styles },
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
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    try {
      const { html } = exportHtml();
      setPreviewHtml(html);
      setShowPreviewDialog(true);
    } catch {
      toast.error("Error al generar preview");
    }
  };

  const handleExportHtml = () => {
    try {
      const { html } = exportHtml();

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${templateName || "email-template"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("HTML exportado correctamente");
    } catch {
      toast.error("Error al exportar HTML");
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
          <div>
            <h1 className="text-xl font-semibold">
              {currentTemplateId ? "Editar Plantilla" : "Crear Plantilla de Email"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Editor de email drag-and-drop
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              loadSavedTemplates();
              setShowTemplatesDialog(true);
            }}
            disabled={!editor || isLoading}
          >
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Usar Template
          </Button>
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!editor || isLoading}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={handleExportHtml}
            disabled={!editor || isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar HTML
          </Button>
          <Button
            onClick={handleSave}
            disabled={!editor || isLoading || isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>
          <Button
            onClick={() => {
              loadRecipients();
              setShowSendDialog(true);
            }}
            disabled={!editor || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="mr-2 h-4 w-4" />
            Enviar
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 130px)" }}>
        {(isLoading || !grapesjs || !GjsEditor) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                {isLoading ? "Cargando plantilla..." : "Cargando editor..."}
              </p>
            </div>
          </div>
        )}
        {grapesjs && GjsEditor && (
          <GjsEditor
            grapesjs={grapesjs}
            onEditor={onEditorReady}
            options={{
              height: "100%",
              width: "100%",
              storageManager: false,
              plugins: ["grapesjs-preset-newsletter"],
              pluginsOpts: {
                "grapesjs-preset-newsletter": {
                  modalTitleImport: "Importar HTML",
                  modalTitleExport: "Exportar HTML",
                },
              },
              assetManager: {
                upload: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/campaigns/email-templates/upload-image`,
                uploadName: "files[]",
                headers: {
                  "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
                },
                multiUpload: false,
                autoAdd: true,
                dropzone: true,
                openAssetsOnDrop: true,
                dropzoneContent: "Arrastra imágenes aquí o haz clic para subir",
              },
              i18n: {
                locale: "es",
                messages: {
                  es: {
                    assetManager: {
                      addButton: "Agregar imagen",
                      inputPlh: "http://ruta/a/la/imagen.jpg",
                      modalTitle: "Seleccionar imagen",
                      uploadTitle: "Arrastra archivos aquí o haz clic para subir",
                    },
                    blockManager: {
                      labels: {},
                      categories: {},
                    },
                    domComponents: {
                      names: {
                        "": "Caja",
                        wrapper: "Cuerpo",
                        text: "Texto",
                        comment: "Comentario",
                        image: "Imagen",
                        video: "Video",
                        label: "Etiqueta",
                        link: "Enlace",
                        map: "Mapa",
                        tfoot: "Pie de tabla",
                        tbody: "Cuerpo de tabla",
                        thead: "Cabecera de tabla",
                        table: "Tabla",
                        row: "Fila de tabla",
                        cell: "Celda de tabla",
                      },
                    },
                    deviceManager: {
                      device: "Dispositivo",
                      devices: {
                        desktop: "Escritorio",
                        tablet: "Tablet",
                        mobileLandscape: "Móvil horizontal",
                        mobilePortrait: "Móvil vertical",
                      },
                    },
                    panels: {
                      buttons: {
                        titles: {
                          preview: "Vista previa",
                          fullscreen: "Pantalla completa",
                          "sw-visibility": "Ver componentes",
                          "export-template": "Ver código",
                          "open-sm": "Abrir estilos",
                          "open-tm": "Configuración",
                          "open-layers": "Abrir capas",
                          "open-blocks": "Abrir bloques",
                        },
                      },
                    },
                    selectorManager: {
                      label: "Clases",
                      selected: "Seleccionado",
                      emptyState: "- Estado -",
                      states: {
                        hover: "Hover",
                        active: "Click",
                        "nth-of-type(2n)": "Par/Impar",
                      },
                    },
                    styleManager: {
                      empty: "Selecciona un elemento para ver estilos",
                      layer: "Capa",
                      fileButton: "Imágenes",
                      sectors: {
                        general: "General",
                        layout: "Diseño",
                        typography: "Tipografía",
                        decorations: "Decoraciones",
                        extra: "Extra",
                        flex: "Flex",
                        dimension: "Dimensión",
                      },
                      properties: {},
                    },
                    traitManager: {
                      empty: "Selecciona un elemento para ver propiedades",
                      label: "Configuración del componente",
                      traits: {
                        labels: {
                          id: "Id",
                          alt: "Texto alternativo",
                          title: "Título",
                          href: "Enlace",
                          target: "Destino",
                        },
                        attributes: {
                          id: "Id del elemento",
                          alt: "Descripción de la imagen",
                          title: "Título del elemento",
                          href: "URL de destino",
                          target: "Abrir en",
                        },
                        options: {
                          target: {
                            false: "Esta ventana",
                            _blank: "Nueva ventana",
                          },
                        },
                      },
                    },
                  },
                },
              },
            }}
          />
        )}
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

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="!max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Vista Previa</span>
              <div className="flex items-center gap-2 mr-8">
                <Button
                  variant={previewMode === "desktop" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === "mobile" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex justify-center p-4 bg-muted/30 rounded-lg">
            <div
              className={`bg-white shadow-lg rounded-lg overflow-hidden transition-all ${
                previewMode === "mobile" ? "w-[375px]" : "w-full max-w-[600px]"
              }`}
            >
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full min-h-[500px] border-0"
                title="Email Preview"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="!max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Seleccionar Template</DialogTitle>
            <DialogDescription>
              Elige un template guardado para usar como base de tu email
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 h-[calc(80vh-120px)]">
            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : savedTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No hay templates guardados</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Guarda tu primer template con la categoría &quot;template&quot; para verlo aquí
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                {savedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group relative border rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer"
                    onClick={() => applyTemplate(template)}
                  >
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {template.thumbnailUrl ? (
                        <img
                          src={template.thumbnailUrl}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary">
                          Usar Template
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-sm truncate">{template.name}</h4>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {template.subject}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="!max-w-3xl h-[85vh]">
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
            {/* Asunto del email */}
            <div className="space-y-2">
              <Label htmlFor="email-subject">Asunto del Email *</Label>
              <Input
                id="email-subject"
                placeholder="Ej: ¡Oferta especial para ti!"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            {/* Buscador y controles */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
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
                Seleccionar todos
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAllRecipients}>
                Limpiar
              </Button>
            </div>

            {/* Contador de seleccionados */}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedRecipients.size} de {recipients.length} destinatarios seleccionados
              </span>
              {selectedRecipients.size > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {selectedRecipients.size} seleccionados
                </Badge>
              )}
            </div>

            {/* Lista de destinatarios */}
            <ScrollArea className="flex-1 border rounded-lg h-[350px]">
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
                  filteredRecipients.map((recipient) => (
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
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowSendDialog(false);
                setSelectedRecipients(new Set());
                setEmailSubject("");
              }}
            >
              Cancelar
            </Button>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
