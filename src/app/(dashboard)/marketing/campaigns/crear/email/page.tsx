"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Save, Send, Eye, Upload, Users, Clock, Target, Paintbrush, LayoutTemplate, Check, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmailPreview } from "@/components/campaigns/email/email-preview";
import StripoEditor from "@/components/marketing/StripoEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MOCK_TEMPLATES = [
  {
    id: "blank",
    name: "En Blanco",
    preview: "https://stripo.email/content/guids/CABINET_07e60d80c3272993072227d867c2957b/images/99361543831968532.png",
    description: "Plantilla vacía para comenzar desde cero",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Email en Blanco</title></head><body style="margin:0;padding:40px;background:#f5f5f5;font-family:Arial,sans-serif"><table width="600" cellpadding="0" cellspacing="0" style="margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1)"><tr><td style="padding:40px;text-align:center"><h1 style="color:#333;font-size:28px;margin:0 0 20px 0">Empieza tu diseño aquí</h1><p style="color:#666;font-size:16px;line-height:1.5;margin:0">Arrastra bloques del panel izquierdo para crear tu email profesional.</p></td></tr></table></body></html>`
  },
  {
    id: "welcome",
    name: "Bienvenida",
    preview: "https://stripo.email/content/guids/CABINET_91d375bbb3586cb1b85943c2f94beff8/images/63941527595338806.png",
    description: "Email de bienvenida para nuevos usuarios",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bienvenida</title></head><body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif"><table width="600" cellpadding="0" cellspacing="0" style="margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:50px 40px;text-align:center"><h1 style="color:#fff;font-size:36px;margin:0 0 15px 0;font-weight:700">¡Bienvenido a Imagiq!</h1><p style="color:rgba(255,255,255,0.9);font-size:18px;margin:0">Estamos emocionados de tenerte con nosotros</p></td></tr><tr><td style="padding:50px 40px"><h2 style="color:#2d3748;font-size:24px;margin:0 0 20px 0">Primeros pasos:</h2><div style="margin:30px 0"><div style="display:flex;align-items:flex-start;margin-bottom:25px"><div style="background:#667eea;color:#fff;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;font-size:18px">1</div><div style="margin-left:20px"><h3 style="color:#2d3748;font-size:18px;margin:0 0 8px 0">Completa tu perfil</h3><p style="color:#718096;font-size:15px;margin:0;line-height:1.6">Añade tu información personal para personalizar tu experiencia</p></div></div><div style="display:flex;align-items:flex-start;margin-bottom:25px"><div style="background:#667eea;color:#fff;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;font-size:18px">2</div><div style="margin-left:20px"><h3 style="color:#2d3748;font-size:18px;margin:0 0 8px 0">Explora funciones</h3><p style="color:#718096;font-size:15px;margin:0;line-height:1.6">Descubre todas las herramientas disponibles en tu panel</p></div></div><div style="display:flex;align-items:flex-start"><div style="background:#667eea;color:#fff;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;font-size:18px">3</div><div style="margin-left:20px"><h3 style="color:#2d3748;font-size:18px;margin:0 0 8px 0">Crea tu primer proyecto</h3><p style="color:#718096;font-size:15px;margin:0;line-height:1.6">Comienza a crear contenido profesional en minutos</p></div></div></div><div style="text-align:center;margin-top:40px"><a href="#" style="display:inline-block;background:#667eea;color:#fff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px">Comenzar ahora</a></div></td></tr><tr><td style="background:#f7fafc;padding:30px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#718096;font-size:14px;margin:0">¿Necesitas ayuda? <a href="#" style="color:#667eea;text-decoration:none">Contáctanos</a></p></td></tr></table></body></html>`
  },
  {
    id: "promo",
    name: "Promoción Especial",
    preview: "https://stripo.email/content/guids/CABINET_8c3080c41094031633534b4156641570/images/22021543832442220.png",
    description: "Plantilla para ofertas y promociones",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Promoción</title></head><body style="margin:0;padding:0;background:#fff3cd;font-family:Arial,sans-serif"><table width="600" cellpadding="0" cellspacing="0" style="margin:30px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.12)"><tr><td style="background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);padding:60px 40px;text-align:center;position:relative"><div style="background:rgba(255,255,255,0.2);border:3px dashed #fff;border-radius:12px;padding:30px;margin:0 auto;max-width:400px"><h1 style="color:#fff;font-size:52px;margin:0 0 10px 0;font-weight:900;text-shadow:2px 2px 4px rgba(0,0,0,0.2)">50% OFF</h1><p style="color:#fff;font-size:24px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:2px">¡Oferta Flash!</p></div></td></tr><tr><td style="padding:50px 40px;text-align:center"><div style="display:inline-block;background:#fef3c7;color:#92400e;padding:12px 24px;border-radius:50px;font-size:14px;font-weight:700;margin-bottom:25px">⏰ SOLO POR 24 HORAS</div><h2 style="color:#1f2937;font-size:28px;margin:0 0 20px 0;font-weight:700">Descuento increíble en todos nuestros productos</h2><p style="color:#6b7280;font-size:17px;line-height:1.6;margin:0 0 35px 0">No pierdas esta oportunidad única. Usa el código <strong style="color:#f5576c;background:#fef2f2;padding:4px 12px;border-radius:4px">FLASH50</strong> al realizar tu compra.</p><a href="#" style="display:inline-block;background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);color:#fff;padding:18px 50px;text-decoration:none;border-radius:50px;font-weight:700;font-size:18px;box-shadow:0 4px 12px rgba(245,87,108,0.4);text-transform:uppercase;letter-spacing:1px">Comprar ahora</a></td></tr><tr><td style="padding:0 40px 50px 40px"><div style="background:#f9fafb;border-radius:12px;padding:30px;border:2px solid #e5e7eb"><h3 style="color:#374151;font-size:20px;margin:0 0 20px 0;text-align:center">¿Por qué comprar ahora?</h3><ul style="list-style:none;padding:0;margin:0"><li style="color:#6b7280;font-size:15px;margin-bottom:12px;padding-left:30px;position:relative">✓ Envío gratis en todas las compras</li><li style="color:#6b7280;font-size:15px;margin-bottom:12px;padding-left:30px;position:relative">✓ Garantía de satisfacción 100%</li><li style="color:#6b7280;font-size:15px;margin-bottom:12px;padding-left:30px;position:relative">✓ Devoluciones gratis por 30 días</li><li style="color:#6b7280;font-size:15px;padding-left:30px;position:relative">✓ Atención al cliente 24/7</li></ul></div></td></tr><tr><td style="background:#111827;padding:30px 40px;text-align:center"><p style="color:#9ca3af;font-size:13px;margin:0">Esta oferta expira el 31 de diciembre, 2025</p></td></tr></table></body></html>`
  },
  {
    id: "newsletter",
    name: "Newsletter",
    preview: "https://stripo.email/content/guids/CABINET_697b973c9657ce186835a6007e992120/images/99161543832819875.png",
    description: "Newsletter mensual con noticias",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Newsletter</title></head><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif"><table width="600" cellpadding="0" cellspacing="0" style="margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden"><tr><td style="background:#1e3a8a;padding:40px;text-align:center"><div style="background:#fff;width:60px;height:60px;margin:0 auto 20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px">📰</div><h1 style="color:#fff;font-size:32px;margin:0 0 10px 0;font-weight:700">Newsletter Mensual</h1><p style="color:rgba(255,255,255,0.8);font-size:16px;margin:0">Diciembre 2025 • Edición #48</p></td></tr><tr><td style="padding:50px 40px"><article style="margin-bottom:40px;padding-bottom:40px;border-bottom:2px solid #e5e7eb"><div style="background:#dbeafe;color:#1e40af;display:inline-block;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:15px;text-transform:uppercase">Destacado</div><h2 style="color:#1f2937;font-size:26px;margin:0 0 15px 0;font-weight:700">Nuevas funciones lanzadas este mes</h2><p style="color:#6b7280;font-size:16px;line-height:1.7;margin:0 0 20px 0">Estamos emocionados de anunciar el lanzamiento de nuestro nuevo panel de análisis. Ahora puedes visualizar métricas en tiempo real y tomar decisiones basadas en datos con mayor facilidad.</p><a href="#" style="color:#1e3a8a;font-weight:600;text-decoration:none;font-size:15px">Leer más →</a></article><article style="margin-bottom:40px;padding-bottom:40px;border-bottom:2px solid #e5e7eb"><div style="background:#fef3c7;color:#92400e;display:inline-block;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:15px;text-transform:uppercase">Producto</div><h2 style="color:#1f2937;font-size:26px;margin:0 0 15px 0;font-weight:700">Guía completa de integración API</h2><p style="color:#6b7280;font-size:16px;line-height:1.7;margin:0 0 20px 0">Aprende cómo integrar nuestra API en tus proyectos con esta guía paso a paso. Incluye ejemplos de código y mejores prácticas para desarrolladores.</p><a href="#" style="color:#1e3a8a;font-weight:600;text-decoration:none;font-size:15px">Leer más →</a></article><article><div style="background:#dcfce7;color:#166534;display:inline-block;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:15px;text-transform:uppercase">Comunidad</div><h2 style="color:#1f2937;font-size:26px;margin:0 0 15px 0;font-weight:700">Casos de éxito de nuestros usuarios</h2><p style="color:#6b7280;font-size:16px;line-height:1.7;margin:0 0 20px 0">Descubre cómo empresas líderes están usando nuestra plataforma para transformar sus operaciones y alcanzar sus objetivos de negocio.</p><a href="#" style="color:#1e3a8a;font-weight:600;text-decoration:none;font-size:15px">Leer más →</a></article></td></tr><tr><td style="background:#f9fafb;padding:40px;text-align:center;border-top:1px solid #e5e7eb"><p style="color:#6b7280;font-size:14px;margin:0 0 15px 0">¿No quieres recibir estos emails?</p><a href="#" style="color:#1e3a8a;font-size:14px;text-decoration:none">Cancelar suscripción</a></td></tr></table></body></html>`
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    preview: "https://stripo.email/content/guids/CABINET_0e8fbb659163a8b76d6d0e2e78378112/images/89071543829767046.png",
    description: "Promoción de productos con catálogo",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tienda</title></head><body style="margin:0;padding:0;background:#fafafa;font-family:Arial,sans-serif"><table width="600" cellpadding="0" cellspacing="0" style="margin:30px auto;background:#ffffff"><tr><td style="background:#000;padding:25px 40px;text-align:center"><h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;letter-spacing:3px">IMAGIQ STORE</h1></td></tr><tr><td style="padding:50px 40px 30px"><h2 style="color:#1f2937;font-size:32px;margin:0 0 15px 0;text-align:center;font-weight:700">Novedades de la Semana</h2><p style="color:#6b7280;font-size:16px;text-align:center;margin:0 0 40px 0">Los productos más esperados ya están disponibles</p></td></tr><tr><td style="padding:0 40px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="260" style="vertical-align:top;padding:0 10px 30px 0"><div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="background:#f3f4f6;padding:40px;text-align:center"><div style="width:180px;height:180px;background:#fff;margin:0 auto;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:72px">👕</div></div><div style="padding:20px"><h3 style="color:#1f2937;font-size:18px;margin:0 0 10px 0;font-weight:700">Camiseta Premium</h3><p style="color:#6b7280;font-size:14px;margin:0 0 15px 0;line-height:1.5">100% algodón orgánico</p><div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#1f2937;font-size:24px;font-weight:700">$29.99</span><a href="#" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Comprar</a></div></div></div></td><td width="260" style="vertical-align:top;padding:0 0 30px 10px"><div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="background:#f3f4f6;padding:40px;text-align:center"><div style="width:180px;height:180px;background:#fff;margin:0 auto;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:72px">👟</div></div><div style="padding:20px"><h3 style="color:#1f2937;font-size:18px;margin:0 0 10px 0;font-weight:700">Zapatillas Sport</h3><p style="color:#6b7280;font-size:14px;margin:0 0 15px 0;line-height:1.5">Tecnología Air Cushion</p><div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#1f2937;font-size:24px;font-weight:700">$89.99</span><a href="#" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Comprar</a></div></div></div></td></tr><tr><td width="260" style="vertical-align:top;padding:0 10px 30px 0"><div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="background:#f3f4f6;padding:40px;text-align:center"><div style="width:180px;height:180px;background:#fff;margin:0 auto;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:72px">🎒</div></div><div style="padding:20px"><h3 style="color:#1f2937;font-size:18px;margin:0 0 10px 0;font-weight:700">Mochila Urban</h3><p style="color:#6b7280;font-size:14px;margin:0 0 15px 0;line-height:1.5">Compartimento para laptop</p><div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#1f2937;font-size:24px;font-weight:700">$49.99</span><a href="#" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Comprar</a></div></div></div></td><td width="260" style="vertical-align:top;padding:0 0 30px 10px"><div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="background:#f3f4f6;padding:40px;text-align:center"><div style="width:180px;height:180px;background:#fff;margin:0 auto;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:72px">⌚</div></div><div style="padding:20px"><h3 style="color:#1f2937;font-size:18px;margin:0 0 10px 0;font-weight:700">Smart Watch Pro</h3><p style="color:#6b7280;font-size:14px;margin:0 0 15px 0;line-height:1.5">GPS y monitor cardíaco</p><div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#1f2937;font-size:24px;font-weight:700">$199</span><a href="#" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Comprar</a></div></div></div></td></tr></table></td></tr><tr><td style="background:#000;padding:30px 40px;text-align:center"><p style="color:#9ca3af;font-size:14px;margin:0">© 2025 ImagiQ Store. Todos los derechos reservados.</p></td></tr></table></body></html>`
  },
  {
    id: "event",
    name: "Evento/Webinar",
    preview: "https://stripo.email/content/guids/CABINET_dd354a98a803b60e2195bc97e6764c19/images/93101543825318636.png",
    description: "Invitación a eventos y webinars",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Evento</title></head><body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif"><table width="600" cellpadding="0" cellspacing="0" style="margin:30px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155"><tr><td style="padding:50px 40px;text-align:center;background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)"><div style="background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.3);border-radius:12px;padding:30px;backdrop-filter:blur(10px)"><div style="color:#fbbf24;font-size:18px;font-weight:700;margin-bottom:15px;text-transform:uppercase;letter-spacing:2px">📅 Evento Virtual</div><h1 style="color:#fff;font-size:36px;margin:0 0 15px 0;font-weight:900;line-height:1.2">Conferencia de Innovación Digital 2025</h1><p style="color:rgba(255,255,255,0.9);font-size:18px;margin:0">El futuro de la tecnología empieza aquí</p></div></td></tr><tr><td style="padding:40px"><div style="background:#334155;border-radius:12px;padding:35px;margin-bottom:30px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="33%" style="text-align:center;padding:15px;border-right:1px solid #475569"><div style="color:#94a3b8;font-size:14px;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Fecha</div><div style="color:#fff;font-size:20px;font-weight:700">15 ENE 2025</div></td><td width="33%" style="text-align:center;padding:15px;border-right:1px solid #475569"><div style="color:#94a3b8;font-size:14px;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Hora</div><div style="color:#fff;font-size:20px;font-weight:700">10:00 AM</div></td><td width="34%" style="text-align:center;padding:15px"><div style="color:#94a3b8;font-size:14px;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Duración</div><div style="color:#fff;font-size:20px;font-weight:700">3 HORAS</div></td></tr></table></div><h2 style="color:#fff;font-size:24px;margin:0 0 20px 0;font-weight:700">Agenda del Evento</h2><div style="background:#334155;border-left:4px solid #3b82f6;padding:20px;margin-bottom:15px;border-radius:6px"><div style="color:#94a3b8;font-size:14px;margin-bottom:5px">10:00 - 10:30</div><h3 style="color:#fff;font-size:18px;margin:0;font-weight:600">Keynote de Apertura</h3></div><div style="background:#334155;border-left:4px solid #8b5cf6;padding:20px;margin-bottom:15px;border-radius:6px"><div style="color:#94a3b8;font-size:14px;margin-bottom:5px">10:30 - 11:30</div><h3 style="color:#fff;font-size:18px;margin:0;font-weight:600">Panel: IA y el Futuro del Trabajo</h3></div><div style="background:#334155;border-left:4px solid #10b981;padding:20px;margin-bottom:15px;border-radius:6px"><div style="color:#94a3b8;font-size:14px;margin-bottom:5px">11:30 - 12:30</div><h3 style="color:#fff;font-size:18px;margin:0;font-weight:600">Workshop: Innovación en la Nube</h3></div><div style="background:#334155;border-left:4px solid #f59e0b;padding:20px;border-radius:6px"><div style="color:#94a3b8;font-size:14px;margin-bottom:5px">12:30 - 13:00</div><h3 style="color:#fff;font-size:18px;margin:0;font-weight:600">Networking Virtual</h3></div><div style="text-align:center;margin-top:40px"><a href="#" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);color:#fff;padding:18px 50px;text-decoration:none;border-radius:50px;font-weight:700;font-size:18px;text-transform:uppercase;letter-spacing:1px;box-shadow:0 4px 14px rgba(59,130,246,0.4)">Reservar mi lugar</a></div></td></tr><tr><td style="background:#0f172a;padding:30px 40px;text-align:center;border-top:1px solid #334155"><p style="color:#64748b;font-size:14px;margin:0">ImagiQ Events • 2025</p></td></tr></table></body></html>`
  },
  {
    id: "survey",
    name: "Encuesta/Feedback",
    preview: "https://stripo.email/content/guids/CABINET_0e8fbb659163a8b76d6d0e2e78378112/images/67671543238557416.png",
    description: "Solicitud de feedback y opiniones",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Encuesta</title></head><body style="margin:0;padding:0;background:#ecfdf5;font-family:Arial,sans-serif"><table width="600" cellpadding="0" cellspacing="0" style="margin:30px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)"><tr><td style="padding:50px 40px;text-align:center"><div style="background:#10b981;width:80px;height:80px;margin:0 auto 25px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:42px">💬</div><h1 style="color:#1f2937;font-size:32px;margin:0 0 15px 0;font-weight:700">Tu opinión es importante</h1><p style="color:#6b7280;font-size:17px;margin:0;line-height:1.6">Ayúdanos a mejorar tu experiencia completando esta breve encuesta</p></td></tr><tr><td style="padding:0 40px 40px"><div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:30px;margin-bottom:30px"><h2 style="color:#166534;font-size:20px;margin:0 0 15px 0;text-align:center">Solo te tomará 2 minutos</h2><div style="text-align:center;margin-top:20px"><div style="display:inline-block;background:#fff;padding:8px 16px;border-radius:20px;margin:0 8px 8px 0;border:1px solid #d1d5db;color:#374151;font-size:14px">⏱️ Rápida</div><div style="display:inline-block;background:#fff;padding:8px 16px;border-radius:20px;margin:0 8px 8px 0;border:1px solid #d1d5db;color:#374151;font-size:14px">✅ 5 preguntas</div><div style="display:inline-block;background:#fff;padding:8px 16px;border-radius:20px;margin:0 8px 8px 0;border:1px solid #d1d5db;color:#374151;font-size:14px">🎁 Recompensa</div></div></div><h3 style="color:#1f2937;font-size:22px;margin:0 0 25px 0;font-weight:700">Preguntas de la encuesta:</h3><div style="margin-bottom:20px;padding:20px;background:#f9fafb;border-radius:8px;border-left:4px solid #10b981"><div style="color:#10b981;font-weight:700;margin-bottom:8px">Pregunta 1</div><div style="color:#374151;font-size:15px">¿Qué tan satisfecho estás con nuestro servicio?</div></div><div style="margin-bottom:20px;padding:20px;background:#f9fafb;border-radius:8px;border-left:4px solid #10b981"><div style="color:#10b981;font-weight:700;margin-bottom:8px">Pregunta 2</div><div style="color:#374151;font-size:15px">¿Qué funcionalidad te gustaría que mejoráramos?</div></div><div style="margin-bottom:20px;padding:20px;background:#f9fafb;border-radius:8px;border-left:4px solid #10b981"><div style="color:#10b981;font-weight:700;margin-bottom:8px">Pregunta 3</div><div style="color:#374151;font-size:15px">¿Recomendarías nuestro producto a un amigo?</div></div><div style="text-align:center;margin-top:40px"><a href="#" style="display:inline-block;background:#10b981;color:#fff;padding:18px 60px;text-decoration:none;border-radius:50px;font-weight:700;font-size:18px;box-shadow:0 4px 14px rgba(16,185,129,0.4)">Completar encuesta</a></div><div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px;margin-top:30px;text-align:center"><p style="color:#92400e;font-size:15px;margin:0"><strong>🎁 Bonus:</strong> Al completar la encuesta, recibirás un 15% de descuento en tu próxima compra</p></div></td></tr><tr><td style="background:#f9fafb;padding:30px 40px;text-align:center;border-top:1px solid #e5e7eb"><p style="color:#6b7280;font-size:14px;margin:0">Gracias por ayudarnos a mejorar • ImagiQ 2025</p></td></tr></table></body></html>`
  },
  {
    id: "abandoned-cart",
    name: "Carrito Abandonado",
    preview: "https://stripo.email/content/guids/CABINET_0e8fbb659163a8b76d6d0e2e78378112/images/52981543835859018.png",
    description: "Recordatorio de carrito de compra",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Carrito</title></head><body style="margin:0;padding:0;background:#fef3c7;font-family:Arial,sans-serif"><table width="600" cellpadding="0" cellspacing="0" style="margin:30px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.1)"><tr><td style="padding:50px 40px;text-align:center"><div style="font-size:64px;margin-bottom:20px">🛒</div><h1 style="color:#1f2937;font-size:32px;margin:0 0 15px 0;font-weight:700">¡Olvidaste algo!</h1><p style="color:#6b7280;font-size:17px;margin:0;line-height:1.6">Dejaste algunos productos en tu carrito. ¡No dejes que se escapen!</p></td></tr><tr><td style="padding:0 40px 30px"><div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:20px"><table width="100%" cellpadding="0" cellspacing="0" style="margin:0;padding:0"><tr><td style="padding:25px;border-bottom:1px solid #e5e7eb"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="80"><div style="width:70px;height:70px;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:36px">📱</div></td><td style="padding-left:20px"><h3 style="color:#1f2937;font-size:18px;margin:0 0 5px 0;font-weight:700">Smartphone Pro X</h3><p style="color:#6b7280;font-size:14px;margin:0">256GB • Negro</p></td><td style="text-align:right"><strong style="color:#1f2937;font-size:20px">$899</strong></td></tr></table></td></tr><tr><td style="padding:25px;border-bottom:1px solid #e5e7eb"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="80"><div style="width:70px;height:70px;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:36px">🎧</div></td><td style="padding-left:20px"><h3 style="color:#1f2937;font-size:18px;margin:0 0 5px 0;font-weight:700">Auriculares Wireless</h3><p style="color:#6b7280;font-size:14px;margin:0">Con cancelación de ruido</p></td><td style="text-align:right"><strong style="color:#1f2937;font-size:20px">$149</strong></td></tr></table></td></tr><tr><td style="padding:25px;background:#f9fafb"><table width="100%" cellpadding="0" cellspacing="0"><tr><td><strong style="color:#1f2937;font-size:18px">Total del carrito:</strong></td><td style="text-align:right"><strong style="color:#059669;font-size:28px">$1,048</strong></td></tr></table></td></tr></table><div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border:2px dashed #f59e0b;border-radius:12px;padding:25px;margin:30px 0;text-align:center"><div style="color:#92400e;font-size:18px;font-weight:700;margin-bottom:8px">🎉 ¡OFERTA ESPECIAL!</div><p style="color:#78350f;font-size:16px;margin:0">Completa tu compra ahora y obtén <strong>10% de descuento adicional</strong></p><p style="color:#92400e;font-size:13px;margin:8px 0 0;font-weight:600">Código: CARRITO10 • Válido por 24 horas</p></div><div style="text-align:center;margin-bottom:25px"><a href="#" style="display:inline-block;background:#059669;color:#fff;padding:18px 60px;text-decoration:none;border-radius:50px;font-weight:700;font-size:18px;box-shadow:0 4px 14px rgba(5,150,105,0.4);text-transform:uppercase">Completar compra</a></div><ul style="list-style:none;padding:0;margin:0;text-align:center"><li style="color:#6b7280;font-size:14px;margin-bottom:10px">✓ Envío gratis en compras superiores a $50</li><li style="color:#6b7280;font-size:14px;margin-bottom:10px">✓ Garantía de devolución de 30 días</li><li style="color:#6b7280;font-size:14px">✓ Pago seguro con encriptación SSL</li></ul></td></tr><tr><td style="background:#f9fafb;padding:30px 40px;text-align:center;border-top:1px solid #e5e7eb"><p style="color:#6b7280;font-size:13px;margin:0 0 10px 0">¿Necesitas ayuda? <a href="#" style="color:#059669;text-decoration:none;font-weight:600">Contáctanos</a></p><p style="color:#9ca3af;font-size:12px;margin:0">© 2025 ImagiQ Store</p></td></tr></table></body></html>`
  },
];

export default function CrearCampaignEmailPage() {
  const router = useRouter();
  const [editorMode, setEditorMode] = useState<"simple" | "visual">("visual");
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [emailData, setEmailData] = useState({
    // Campaign Info
    campaignName: "",
    campaignType: "promotional",
    targetAudience: "all",

    // Email Settings
    subject: "",
    fromName: "",
    fromEmail: "",
    preheader: "",
    replyTo: "",

    // Content (Simple Mode)
    headerImage: "",
    title: "",
    subtitle: "",
    content: "",
    buttonText: "",
    buttonUrl: "",
    footerText: "",

    // Content (Visual Mode)
    htmlContent: "",
    designJson: null as any,

    // Company Info
    companyName: "Tu Empresa",
    companyAddress: "123 Calle Principal, Ciudad, País",
    unsubscribeText: "Si no deseas recibir más emails, puedes darte de baja",

    // Scheduling
    sendImmediately: true,
    scheduledDate: null as Date | null,

    // A/B Testing
    enableABTest: false,
    abTestPercentage: 50
  });

  const handleGoBack = () => {
    router.push('/marketing/campaigns');
  };

  const handleSave = async () => {
    try {
      console.log("Guardando campaña email:", emailData);

      // Transform frontend data to backend DTO
      const templateData = {
        name: emailData.campaignName || 'Untitled Campaign',
        subject: emailData.subject,
        htmlContent: emailData.htmlContent || emailData.content, // Use htmlContent from Stripo or plain content
        plainTextContent: emailData.content, // Fallback
        designJson: emailData.designJson, // Stripo design
        category: emailData.campaignType,
        variables: [], // TODO: Extract variables if needed
        status: 'draft',
        // Note: For now we are saving to EmailTemplate. 
        // In the future we might want to separate Campaign and Template entities explicitly 
        // or have a Campaign entity that references a Template.
        // For this MVP, we create a template.
      };

      // Auto-detect backend URL (supports devtunnels)
      const backendUrl = typeof window !== 'undefined'
        ? window.location.hostname.includes('devtunnels.ms')
          ? window.location.origin.replace('-3010', '-3001')
          : window.location.origin.replace(/:\d+/, ':3001')
        : 'http://localhost:3001';

      const response = await fetch(`${backendUrl}/api/messaging/email-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la campaña');
      }

      const result = await response.json();
      alert('Campaña guardada correctamente');
      router.push('/marketing/campaigns');

    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Error al guardar la campaña');
    }
  };

  const handleSend = () => {
    console.log("Enviando campaña email:", emailData);
  };

  const handleStripoSave = (html: string, css: string) => {
    setEmailData(prev => ({
      ...prev,
      htmlContent: html, // Stripo normally returns HTML with inlined CSS or style tags
      designJson: null // We can extract design JSON separately if needed
    }));
    console.log("Diseño guardado desde Stripo");
  };

  const loadTemplate = (template: typeof MOCK_TEMPLATES[0]) => {
    setEmailData(prev => ({
      ...prev,
      htmlContent: template.html,
      // We might ideally want Stripo JSON here, but HTML is okay to start
      designJson: null
    }));
    setSelectedTemplateId(template.id);
    setIsTemplateModalOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Campaña Email</h1>
          <p className="text-muted-foreground">
            Configura tu campaña de email marketing
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Column */}
        <div className={editorMode === 'visual' ? "lg:col-span-12 space-y-6" : "lg:col-span-8 space-y-6"}>
          {/* 1. Campaign Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaignName">Nombre de la Campaña</Label>
                <div className="flex gap-2">
                  <Input
                    id="campaignName"
                    placeholder="Ej: Newsletter Semanal"
                    value={emailData.campaignName}
                    onChange={(e) => setEmailData(prev => ({ ...prev, campaignName: e.target.value }))}
                  />
                  {editorMode === 'visual' && (
                    <Button variant="outline" onClick={() => setIsTemplateModalOpen(true)}>
                      <LayoutTemplate className="mr-2 h-4 w-4" />
                      Cargar Plantilla
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asunto</Label>
                  <Input
                    placeholder="Asunto del correo"
                    value={emailData.subject}
                    onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preheader</Label>
                  <Input
                    placeholder="Texto de previsualización"
                    value={emailData.preheader}
                    onChange={(e) => setEmailData(prev => ({ ...prev, preheader: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Content Editor */}
          <Card className="min-h-[700px] flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Paintbrush className="h-5 w-5" />
                  Diseño del Email
                </CardTitle>
                <Tabs value={editorMode} onValueChange={(v: any) => setEditorMode(v)} className="w-[300px]">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="simple">Simple</TabsTrigger>
                    <TabsTrigger value="visual">Visual (Stripo)</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {editorMode === 'visual' ? (
                <div className="h-[800px] w-full border-t">
                  <StripoEditor
                    // Added key based on html length or ID to force re-render if needed
                    // But Stripo might handle updates. Let's try key approach for robust re-loading.
                    key={selectedTemplateId || 'default'}
                    onSave={handleStripoSave}
                    initialHtml={emailData.htmlContent}
                  />
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={emailData.title}
                      onChange={(e) => setEmailData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contenido</Label>
                    <Textarea
                      rows={10}
                      value={emailData.content}
                      onChange={(e) => setEmailData(prev => ({ ...prev, content: e.target.value }))}
                    />
                  </div>
                  <div className="alert alert-info bg-blue-50 text-blue-700 p-4 rounded text-sm">
                    El modo simple usa una plantilla base predefinida. Para mayor control, usa el modo Visual.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column - Moved to bottom when in visual mode for full width editor */}
        <div className={editorMode === 'visual' ? "lg:col-span-12" : "lg:col-span-4 space-y-6"}>
          <Card>
            <CardHeader>
              <CardTitle>Resumen y Envío</CardTitle>
            </CardHeader>
            <CardContent className={editorMode === 'visual' ? "flex flex-wrap gap-6 items-end" : "space-y-4"}>
              <div className={editorMode === 'visual' ? "w-full md:w-1/3 space-y-2" : "space-y-2"}>
                <Label>Audiencia</Label>
                <Select
                  value={emailData.targetAudience}
                  onValueChange={(value) => setEmailData(prev => ({ ...prev, targetAudience: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar audiencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los usuarios</SelectItem>
                    <SelectItem value="customers">Clientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={editorMode === 'visual' ? "w-full md:w-1/3 space-y-2" : "space-y-2"}>
                <Label>Remitente</Label>
                <div className="flex gap-2">
                  <Input
                    value={emailData.fromName}
                    onChange={(e) => setEmailData(prev => ({ ...prev, fromName: e.target.value }))}
                    placeholder="Nombre"
                    className={editorMode !== 'visual' ? "mb-2" : ""}
                  />
                  <Input
                    value={emailData.fromEmail}
                    onChange={(e) => setEmailData(prev => ({ ...prev, fromEmail: e.target.value }))}
                    placeholder="Email"
                  />
                </div>
              </div>

              {editorMode !== 'visual' && <Separator />}

              <div className={editorMode === 'visual' ? "w-full md:w-auto flex items-center gap-4 mb-2" : "flex items-center justify-between"}>
                <Label>Enviar Inmediatamente</Label>
                <Switch
                  checked={emailData.sendImmediately}
                  onCheckedChange={(c) => setEmailData(prev => ({ ...prev, sendImmediately: c }))}
                />
              </div>

              <div className={editorMode === 'visual' ? "w-full md:w-auto flex gap-2 ml-auto" : "pt-4 flex flex-col gap-2"}>
                <Button className={editorMode === 'visual' ? "w-[150px]" : "w-full"} onClick={handleSave} variant="outline">
                  <Save className="mr-2 h-4 w-4" /> Guardar
                </Button>
                <Button className={editorMode === 'visual' ? "w-[150px]" : "w-full"} onClick={handleSend}>
                  <Send className="mr-2 h-4 w-4" /> Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">📧 Seleccionar Plantilla de Email</DialogTitle>
            <DialogDescription>
              Elige una plantilla profesional para comenzar tu campaña. Cada plantilla está optimizada para diferentes objetivos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 pb-2">
            {MOCK_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="border-2 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all group relative bg-white"
                onClick={() => loadTemplate(template)}
              >
                <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative">
                  {template.preview ? (
                    <img
                      src={template.preview}
                      alt={template.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">Sin vista previa</div>
                  )}
                  {/* Badge with template type */}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-blue-600 shadow-sm">
                    {template.id === 'blank' ? '🎨 Vacío' :
                      template.id === 'welcome' ? '👋 Bienvenida' :
                        template.id === 'promo' ? '🎉 Oferta' :
                          template.id === 'newsletter' ? '📰 News' :
                            template.id === 'ecommerce' ? '🛍️ Tienda' :
                              template.id === 'event' ? '📅 Evento' :
                                template.id === 'survey' ? '💬 Encuesta' : '🛒 Carrito'}
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <h3 className="font-bold text-base text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/90 to-blue-500/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button variant="secondary" size="lg" className="shadow-xl mb-2 bg-white hover:bg-gray-100">
                    <FileText className="mr-2 h-4 w-4" />
                    Usar esta Plantilla
                  </Button>
                  <p className="text-white text-sm font-medium px-4 text-center">{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}