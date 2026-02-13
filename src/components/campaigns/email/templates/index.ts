// Predefined Unlayer email templates — imagiq / Samsung branding
// Each template is a valid Unlayer design JSON that can be loaded with editor.loadDesign()

export interface PredefinedTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  design: any;
}

// ── Constants ──
const IMAGIQ_URL = "https://www.imagiq.com";
const SAMSUNG_LOGO =
  "https://res.cloudinary.com/drsvq4tm6/image/upload/v1763944859/Samsung_logo_wordmark.svg_avyk3u.png";
// White version via Cloudinary negate transform (visible on black backgrounds)
const SAMSUNG_LOGO_WHITE =
  "https://res.cloudinary.com/drsvq4tm6/image/upload/e_negate/v1763944859/Samsung_logo_wordmark.svg_avyk3u.png";
const YEAR = new Date().getFullYear();

// ── Unique ID generator ──
let idCounter = 0;
const uid = () => `tmpl_${++idCounter}`;

// ── Row / Column / Content builders ──

const makeRow = (columns: any[], bgColor?: string): any => ({
  id: uid(),
  cells: columns.map(() => 1),
  columns,
  values: {
    displayCondition: null,
    columns: false,
    backgroundColor: bgColor || "",
    columnsBackgroundColor: "",
    backgroundImage: { url: "", fullWidth: true, repeat: "no-repeat", size: "custom", position: "center" },
    padding: "0px",
    anchor: "",
    hideDesktop: false,
    _meta: { htmlID: uid(), htmlClassNames: "u_row" },
    selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
  },
});

const makeColumn = (contents: any[]): any => ({
  id: uid(),
  contents,
  values: {
    backgroundColor: "",
    padding: "0px",
    border: {},
    borderRadius: "0px",
    _meta: { htmlID: uid(), htmlClassNames: "u_column" },
  },
});

const makeText = (html: string, padding = "10px"): any => ({
  id: uid(),
  type: "text",
  values: {
    containerPadding: padding,
    anchor: "",
    fontSize: "14px",
    textAlign: "left",
    lineHeight: "160%",
    linkStyle: { inherit: true, linkColor: "#0000ee", linkUnderline: true, linkHoverColor: "#0000ee", linkHoverUnderline: true },
    hideDesktop: false,
    displayCondition: null,
    _meta: { htmlID: uid(), htmlClassNames: "u_content_text" },
    selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
    text: html,
  },
});

const makeHeading = (text: string, opts: { level?: string; fontSize?: string; color?: string; padding?: string; align?: string } = {}): any => ({
  id: uid(),
  type: "heading",
  values: {
    containerPadding: opts.padding || "10px",
    anchor: "",
    headingType: opts.level || "h1",
    fontWeight: 700,
    fontSize: opts.fontSize || "28px",
    color: opts.color || "#1a1a1a",
    textAlign: opts.align || "center",
    lineHeight: "140%",
    linkStyle: { inherit: true, linkColor: "#0000ee", linkUnderline: true, linkHoverColor: "#0000ee", linkHoverUnderline: true },
    hideDesktop: false,
    displayCondition: null,
    _meta: { htmlID: uid(), htmlClassNames: "u_content_heading" },
    selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
    text,
  },
});

const makeButton = (text: string, opts: { bgColor?: string; color?: string; href?: string; padding?: string; borderRadius?: string } = {}): any => ({
  id: uid(),
  type: "button",
  values: {
    containerPadding: opts.padding || "10px",
    anchor: "",
    href: { name: "web", values: { href: opts.href || IMAGIQ_URL, target: "_blank" } },
    buttonColors: { color: opts.color || "#ffffff", backgroundColor: opts.bgColor || "#1a1a1a", hoverColor: "#ffffff", hoverBackgroundColor: "#333333" },
    size: { autoWidth: true, width: "100%" },
    textAlign: "center",
    lineHeight: "120%",
    padding: "14px 40px",
    border: {},
    borderRadius: opts.borderRadius || "0px",
    hideDesktop: false,
    displayCondition: null,
    _meta: { htmlID: uid(), htmlClassNames: "u_content_button" },
    selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
    text: `<span style="font-size: 14px; font-weight: 600; line-height: 16.8px;">${text}</span>`,
    calculatedWidth: 150,
    calculatedHeight: 44,
  },
});

const makeImage = (url: string, opts: { padding?: string; width?: number; height?: number; maxWidth?: string; href?: string } = {}): any => ({
  id: uid(),
  type: "image",
  values: {
    containerPadding: opts.padding || "10px",
    anchor: "",
    src: { url, width: opts.width || 600, height: opts.height || 300, maxWidth: opts.maxWidth || "100%", autoWidth: false },
    textAlign: "center",
    altText: "",
    action: { name: "web", values: { href: opts.href || IMAGIQ_URL, target: "_blank" } },
    hideDesktop: false,
    displayCondition: null,
    _meta: { htmlID: uid(), htmlClassNames: "u_content_image" },
    selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
  },
});

const makeDivider = (opts: { padding?: string; color?: string } = {}): any => ({
  id: uid(),
  type: "divider",
  values: {
    containerPadding: opts.padding || "10px 10px 10px 10px",
    anchor: "",
    border: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: opts.color || "#e8e8e8" },
    textAlign: "center",
    hideDesktop: false,
    displayCondition: null,
    _meta: { htmlID: uid(), htmlClassNames: "u_content_divider" },
    selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
  },
});

const makeBody = (rows: any[], bgColor = "#f5f5f5", contentWidth = "600px"): any => ({
  id: uid(),
  rows,
  values: {
    popupPosition: "center",
    popupWidth: "600px",
    popupHeight: "auto",
    borderRadius: "0px",
    contentAlign: "center",
    contentVerticalAlign: "center",
    contentWidth,
    fontFamily: { label: "Helvetica", value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" },
    textColor: "#1a1a1a",
    popupBackgroundColor: "#FFFFFF",
    popupBackgroundImage: { url: "", fullWidth: true, repeat: "no-repeat", size: "cover", position: "center" },
    popupOverlay_backgroundColor: "rgba(0, 0, 0, 0.1)",
    popupCloseButton_position: "top-right",
    popupCloseButton_backgroundColor: "#DDDDDD",
    popupCloseButton_iconColor: "#000000",
    popupCloseButton_borderRadius: "0px",
    popupCloseButton_margin: "0px",
    popupCloseButton_action: { name: "close_popup", attrs: { onClick: "document.querySelector('.u-popup-container').style.display = 'none';" } },
    backgroundColor: bgColor,
    backgroundImage: { url: "", fullWidth: true, repeat: "no-repeat", size: "custom", position: "center" },
    preheaderText: "",
    linkStyle: { body: true, linkColor: "#1a1a1a", linkHoverColor: "#333333", linkUnderline: true, linkHoverUnderline: true },
    _meta: { htmlID: "u_body", htmlClassNames: "u_body" },
  },
});

// ── Shared imagiq Header & Footer (matches backend order-confirmation emails) ──

const makeImagiqHeader = (): any =>
  makeRow([makeColumn([
    makeImage(SAMSUNG_LOGO_WHITE, { padding: "28px 10px", width: 220, height: 32, maxWidth: "220px", href: IMAGIQ_URL }),
  ])], "#000000");

const makeImagiqFooter = (): any =>
  makeRow([makeColumn([
    makeText(
      [
        `<div style="text-align:center;margin-bottom:20px;">`,
        `<a href="${IMAGIQ_URL}/ofertas" style="color:#ffffff;text-decoration:none;margin:0 12px;font-size:14px;">Ofertas</a>`,
        `<a href="${IMAGIQ_URL}/productos/dispositivos-moviles" style="color:#ffffff;text-decoration:none;margin:0 12px;font-size:14px;">Dispositivos móviles</a>`,
        `<a href="${IMAGIQ_URL}/productos/tv-y-audio" style="color:#ffffff;text-decoration:none;margin:0 12px;font-size:14px;">TV y Audio</a>`,
        `<a href="${IMAGIQ_URL}/productos/electrodomesticos" style="color:#ffffff;text-decoration:none;margin:0 12px;font-size:14px;">Electrodomésticos</a>`,
        `</div>`,
        `<div style="border-top:1px solid #333;padding-top:20px;text-align:center;">`,
        `<p style="margin:0 0 10px;"><a href="${IMAGIQ_URL}/soporte/politicas-generales" style="color:#ffffff;text-decoration:underline;font-size:13px;">Políticas Generales</a></p>`,
        `<p style="color:#ffffff;font-size:12px;opacity:0.9;margin:0 0 5px;">Copyright© 1995-${YEAR} SAMSUNG. Todos los derechos reservados.</p>`,
        `<p style="color:#ffffff;font-size:11px;opacity:0.8;margin:0 0 10px;">Distribuidor autorizado SAMSUNG en Colombia</p>`,
        `<p style="margin:0;"><a href="#" style="color:#999999;text-decoration:none;font-size:11px;">Cancelar suscripción</a></p>`,
        `</div>`,
      ].join(""),
      "30px 25px",
    ),
  ])], "#000000");

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── TEMPLATE: Promoción / Venta ───
const promoSaleDesign = () => {
  idCounter = 0;
  return {
    counters: { u_row: 5, u_column: 5, u_content_text: 5, u_content_heading: 2, u_content_button: 1, u_content_divider: 1 },
    body: makeBody([
      makeImagiqHeader(),
      // Banner
      makeRow([makeColumn([
        makeHeading("OFERTA ESPECIAL", { fontSize: "32px", color: "#ffffff", padding: "30px 10px 5px" }),
        makeText('<p style="text-align:center;color:#d1d5db;font-size:16px;">Solo por tiempo limitado</p>', "5px 10px 30px"),
      ])], "#1a1a1a"),
      // Body
      makeRow([makeColumn([
        makeHeading("Hasta 50% de Descuento", { fontSize: "24px", padding: "40px 30px 15px" }),
        makeText(`<p style="text-align:center;color:#767676;font-size:16px;line-height:1.6;">Aprovecha nuestras increíbles ofertas en productos seleccionados. ¡No te lo pierdas!</p>`, "0px 30px 25px"),
        makeButton("Ver Todas las Ofertas", { href: `${IMAGIQ_URL}/ofertas`, padding: "10px 30px 40px" }),
      ])], "#ffffff"),
      // Support
      makeRow([makeColumn([
        makeDivider({ padding: "0px 30px" }),
        makeText(`<p style="text-align:center;color:#767676;font-size:14px;">¿Necesitas ayuda? Visita <a href="${IMAGIQ_URL}/soporte" style="color:#1a1a1a;text-decoration:underline;">nuestro centro de soporte</a></p>`, "15px 30px"),
      ])], "#ffffff"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Nuevo Producto ───
const newProductDesign = () => {
  idCounter = 100;
  return {
    counters: { u_row: 5, u_column: 5, u_content_text: 4, u_content_heading: 2, u_content_button: 1, u_content_image: 1 },
    body: makeBody([
      makeImagiqHeader(),
      // Banner
      makeRow([makeColumn([
        makeText('<p style="text-align:center;color:#999999;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Recién Llegado</p>', "30px 10px 5px"),
        makeHeading("Nuevo Producto", { fontSize: "32px", color: "#ffffff", padding: "0px 10px 30px" }),
      ])], "#1a1a1a"),
      // Image
      makeRow([makeColumn([
        makeImage("https://placehold.co/600x400/f8f8f8/767676?text=Imagen+del+Producto", { padding: "0px" }),
      ])], "#ffffff"),
      // Body
      makeRow([makeColumn([
        makeHeading("Nombre del Producto", { fontSize: "26px", padding: "40px 30px 15px" }),
        makeText('<p style="text-align:center;color:#767676;font-size:16px;line-height:1.6;">Descripción breve del producto. Destaca las características principales y beneficios que ofrece a tus clientes.</p>', "0px 30px 10px"),
        makeText('<p style="text-align:center;color:#1a1a1a;font-size:32px;font-weight:bold;">$299.99</p>', "0px 30px 15px"),
        makeButton("Comprar Ahora", { href: IMAGIQ_URL, padding: "10px 30px 40px" }),
      ])], "#ffffff"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Bienvenida ───
const welcomeDesign = () => {
  idCounter = 200;
  return {
    counters: { u_row: 5, u_column: 5, u_content_text: 5, u_content_heading: 1, u_content_button: 1 },
    body: makeBody([
      makeImagiqHeader(),
      // Banner
      makeRow([makeColumn([
        makeHeading("¡Bienvenido!", { fontSize: "32px", color: "#ffffff", padding: "50px 10px 10px" }),
        makeText('<p style="text-align:center;color:#d1d5db;font-size:18px;">Gracias por unirte a nuestra comunidad</p>', "0px 10px 40px"),
      ])], "#1a1a1a"),
      // Body
      makeRow([makeColumn([
        makeText('<p style="color:#1a1a1a;font-size:18px;">Hola <strong>[Nombre]</strong>,</p>', "40px 30px 10px"),
        makeText('<p style="color:#767676;font-size:16px;line-height:1.7;">Estamos emocionados de tenerte con nosotros. A partir de ahora, serás el primero en enterarte de nuestras ofertas exclusivas, nuevos productos y promociones especiales.</p>', "0px 30px 20px"),
        makeText(`<div style="background:#f8f8f8;border-left:4px solid #1a1a1a;padding:20px;border-radius:0 8px 8px 0;"><p style="color:#1a1a1a;font-weight:bold;">Regalo de Bienvenida</p><p style="color:#767676;font-size:14px;margin-top:8px;">Usa el código <strong>BIENVENIDO15</strong> y obtén 15% de descuento en tu primera compra.</p></div>`, "0px 30px 25px"),
        makeButton("Explorar Tienda", { href: IMAGIQ_URL, padding: "10px 30px 40px" }),
      ])], "#ffffff"),
      // Social
      makeRow([makeColumn([
        makeText(`<p style="text-align:center;color:#767676;font-size:14px;">Síguenos en redes sociales</p><p style="text-align:center;margin-top:10px;"><a href="${IMAGIQ_URL}" style="color:#767676;text-decoration:none;margin:0 10px;">Facebook</a> <a href="${IMAGIQ_URL}" style="color:#767676;text-decoration:none;margin:0 10px;">Instagram</a> <a href="${IMAGIQ_URL}" style="color:#767676;text-decoration:none;margin:0 10px;">Twitter</a></p>`, "25px 10px"),
      ])], "#f8f8f8"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Carrito Abandonado ───
const abandonedCartDesign = () => {
  idCounter = 300;
  return {
    counters: { u_row: 4, u_column: 4, u_content_text: 5, u_content_heading: 1, u_content_button: 1 },
    body: makeBody([
      makeImagiqHeader(),
      // Banner
      makeRow([makeColumn([
        makeHeading("¡Olvidaste algo!", { fontSize: "28px", color: "#ffffff", padding: "30px 10px" }),
      ])], "#1a1a1a"),
      // Body
      makeRow([makeColumn([
        makeText('<p style="color:#1a1a1a;font-size:18px;">Hola <strong>[Nombre]</strong>,</p>', "40px 30px 10px"),
        makeText('<p style="color:#767676;font-size:16px;line-height:1.6;">Notamos que dejaste algunos productos en tu carrito. ¡No te preocupes! Los guardamos para ti.</p>', "0px 30px 25px"),
        makeText('<div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:8px;padding:20px;"><p style="color:#1a1a1a;font-weight:bold;font-size:16px;">Nombre del Producto</p><p style="color:#767676;font-size:14px;">Cantidad: 1</p><p style="color:#1a1a1a;font-size:20px;font-weight:bold;margin-top:5px;">$149.99</p></div>', "0px 30px 25px"),
        makeButton("Completar Compra", { href: IMAGIQ_URL, padding: "10px 30px 20px" }),
        makeText('<div style="background:#f8f8f8;padding:15px;border-radius:8px;text-align:center;"><p style="color:#767676;font-size:14px;">Tu carrito expira en <strong style="color:#1a1a1a;">24 horas</strong></p></div>', "0px 30px 40px"),
      ])], "#ffffff"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Confirmación de Pedido ───
const orderConfirmDesign = () => {
  idCounter = 400;
  return {
    counters: { u_row: 5, u_column: 5, u_content_text: 6, u_content_heading: 2, u_content_divider: 1, u_content_button: 1 },
    body: makeBody([
      makeImagiqHeader(),
      // Confirmation banner
      makeRow([makeColumn([
        makeText('<p style="text-align:center;font-size:48px;margin-bottom:10px;">✓</p>', "30px 10px 0px"),
        makeHeading("Confirmación de Pedido", { fontSize: "24px", color: "#ffffff", padding: "0px 10px 5px" }),
        makeText('<p style="text-align:center;color:#d1d5db;font-size:16px;">Orden #12345678</p>', "0px 10px 30px"),
      ])], "#1a1a1a"),
      // Order summary card (dark, like backend)
      makeRow([makeColumn([
        makeText('<div style="background:#1a1a1a;border-radius:0;padding:24px;"><table style="width:100%;"><tr><td style="width:50%;"><p style="color:#767676;font-size:11px;text-transform:uppercase;letter-spacing:1px;">TOTAL DEL PEDIDO</p><p style="color:#ffffff;font-size:28px;font-weight:bold;margin-top:4px;">$249.98</p></td><td style="width:50%;text-align:right;"><p style="color:#767676;font-size:11px;text-transform:uppercase;letter-spacing:1px;">ENVÍO</p><p style="color:#ffffff;font-size:14px;margin-top:4px;">Envío estándar</p></td></tr></table></div>', "0px"),
      ])], "#ffffff"),
      // Body
      makeRow([makeColumn([
        makeText('<p style="color:#1a1a1a;font-size:15px;line-height:1.6;">Hola <strong>[Nombre]</strong>, hemos recibido tu pedido y estamos preparándolo para enviarlo.</p>', "30px 30px 20px"),
        makeHeading("Productos", { level: "h3", fontSize: "12px", color: "#767676", padding: "0px 30px 10px", align: "left" }),
        makeDivider({ padding: "0px 30px" }),
        makeText('<table style="width:100%;"><tr><td style="padding:15px 0;"><strong>Producto 1</strong><br/><span style="color:#767676;font-size:13px;">Cantidad: 1</span></td><td style="text-align:right;font-weight:bold;">$99.99</td></tr><tr><td style="padding:15px 0;border-top:1px solid #e8e8e8;"><strong>Producto 2</strong><br/><span style="color:#767676;font-size:13px;">Cantidad: 2</span></td><td style="text-align:right;font-weight:bold;border-top:1px solid #e8e8e8;">$149.99</td></tr></table>', "10px 30px"),
        makeButton("Rastrear Pedido", { href: `${IMAGIQ_URL}/seguimiento`, padding: "20px 30px 10px" }),
      ])], "#ffffff"),
      // Shipping
      makeRow([makeColumn([
        makeText('<p style="color:#767676;font-size:12px;text-transform:uppercase;letter-spacing:1px;">DIRECCIÓN DE ENVÍO</p>', "25px 30px 5px"),
        makeText('<p style="color:#1a1a1a;font-size:14px;line-height:1.6;">[Nombre del Cliente]<br/>[Dirección]<br/>[Ciudad, Departamento]</p>', "0px 30px 25px"),
      ])], "#f8f8f8"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Newsletter ───
const newsletterDesign = () => {
  idCounter = 500;
  return {
    counters: { u_row: 6, u_column: 6, u_content_text: 6, u_content_heading: 2, u_content_button: 1, u_content_image: 1, u_content_divider: 1 },
    body: makeBody([
      makeImagiqHeader(),
      // Hero image
      makeRow([makeColumn([
        makeImage("https://placehold.co/600x300/1a1a1a/ffffff?text=Newsletter+imagiq", { padding: "0px" }),
      ])]),
      // Content
      makeRow([makeColumn([
        makeHeading("Las Novedades de Esta Semana", { fontSize: "24px", padding: "40px 30px 15px" }),
        makeText('<p style="color:#767676;font-size:16px;line-height:1.7;">Descubre las últimas noticias, tendencias y ofertas exclusivas que tenemos para ti. ¡No te pierdas nada!</p>', "0px 30px 25px"),
        makeText(`<p style="font-size:18px;font-weight:bold;color:#1a1a1a;">Título del Artículo</p><p style="color:#767676;font-size:14px;line-height:1.5;margin-top:8px;">Breve descripción del artículo o noticia que quieres compartir con tus suscriptores.</p><p style="margin-top:12px;"><a href="${IMAGIQ_URL}" style="color:#1a1a1a;font-weight:bold;text-decoration:underline;">Leer más →</a></p>`, "0px 30px 20px"),
        makeDivider({ padding: "0px 30px" }),
        makeText(`<p style="font-size:18px;font-weight:bold;color:#1a1a1a;">Otro Artículo Interesante</p><p style="color:#767676;font-size:14px;line-height:1.5;margin-top:8px;">Otra descripción breve para mantener a tus lectores interesados en tu contenido.</p><p style="margin-top:12px;"><a href="${IMAGIQ_URL}" style="color:#1a1a1a;font-weight:bold;text-decoration:underline;">Leer más →</a></p>`, "15px 30px 30px"),
      ])], "#ffffff"),
      // CTA
      makeRow([makeColumn([
        makeHeading("¿Te gustó nuestro contenido?", { fontSize: "20px", color: "#ffffff", padding: "30px 10px 15px" }),
        makeButton("Visitar Tienda", { bgColor: "#ffffff", color: "#1a1a1a", href: IMAGIQ_URL, padding: "0px 10px 30px" }),
      ])], "#1a1a1a"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Venta Relámpago / Flash Sale ───
const flashSaleDesign = () => {
  idCounter = 600;
  return {
    counters: { u_row: 7, u_column: 8, u_content_text: 9, u_content_heading: 2, u_content_button: 2, u_content_image: 3, u_content_divider: 0 },
    body: makeBody([
      makeImagiqHeader(),
      // Top bar
      makeRow([makeColumn([
        makeText('<p style="text-align:center;color:#fbbf24;font-size:13px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;">SOLO HOY — ENVÍO GRATIS EN TODOS LOS PEDIDOS</p>', "12px 10px"),
      ])], "#1a1a1a"),
      // Hero
      makeRow([makeColumn([
        makeText('<p style="text-align:center;color:#ef4444;font-size:14px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;">VENTA RELÁMPAGO</p>', "40px 10px 10px"),
        makeHeading("HASTA 70% OFF", { fontSize: "52px", color: "#ffffff", padding: "0px 10px 5px" }),
        makeText(`<p style="text-align:center;color:#d1d5db;font-size:18px;line-height:1.5;">Las mejores ofertas a precios que no vas a creer.<br/>Válidas solo por <strong style="color:#fbbf24;">24 HORAS</strong>.</p>`, "5px 30px 25px"),
        makeButton("COMPRAR AHORA", { bgColor: "#ef4444", href: `${IMAGIQ_URL}/ofertas`, padding: "0px 30px 15px", borderRadius: "0px" }),
        makeText('<p style="text-align:center;color:#767676;font-size:13px;">Usa el código <strong style="color:#fbbf24;">FLASH70</strong> al pagar</p>', "0px 10px 40px"),
      ])], "#111827"),
      // Products grid - 3 columns
      makeRow([
        makeColumn([
          makeImage("https://placehold.co/200x200/f8f8f8/767676?text=Producto+1", { padding: "20px 10px 10px", maxWidth: "80%" }),
          makeText('<p style="text-align:center;font-weight:bold;font-size:14px;color:#1a1a1a;">Smartphone Pro</p><p style="text-align:center;"><span style="color:#ef4444;font-weight:bold;font-size:20px;">$299</span> <span style="color:#767676;text-decoration:line-through;font-size:14px;">$999</span></p>', "5px 10px 20px"),
        ]),
        makeColumn([
          makeImage("https://placehold.co/200x200/f8f8f8/767676?text=Producto+2", { padding: "20px 10px 10px", maxWidth: "80%" }),
          makeText('<p style="text-align:center;font-weight:bold;font-size:14px;color:#1a1a1a;">Auriculares Elite</p><p style="text-align:center;"><span style="color:#ef4444;font-weight:bold;font-size:20px;">$79</span> <span style="color:#767676;text-decoration:line-through;font-size:14px;">$249</span></p>', "5px 10px 20px"),
        ]),
        makeColumn([
          makeImage("https://placehold.co/200x200/f8f8f8/767676?text=Producto+3", { padding: "20px 10px 10px", maxWidth: "80%" }),
          makeText('<p style="text-align:center;font-weight:bold;font-size:14px;color:#1a1a1a;">Reloj Smart</p><p style="text-align:center;"><span style="color:#ef4444;font-weight:bold;font-size:20px;">$149</span> <span style="color:#767676;text-decoration:line-through;font-size:14px;">$499</span></p>', "5px 10px 20px"),
        ]),
      ], "#ffffff"),
      // CTA
      makeRow([makeColumn([
        makeButton("VER TODAS LAS OFERTAS", { href: `${IMAGIQ_URL}/ofertas`, padding: "25px 30px" }),
      ])], "#ffffff"),
      // Countdown urgency
      makeRow([makeColumn([
        makeText('<div style="text-align:center;"><p style="color:#ffffff;font-size:14px;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">La oferta termina en</p><table style="margin:0 auto;"><tr><td style="background:#1a1a1a;border-radius:4px;padding:12px 18px;text-align:center;margin:0 5px;"><span style="color:#fbbf24;font-size:28px;font-weight:bold;">12</span><br/><span style="color:#767676;font-size:10px;text-transform:uppercase;">Horas</span></td><td style="color:#ffffff;font-size:28px;padding:0 8px;">:</td><td style="background:#1a1a1a;border-radius:4px;padding:12px 18px;text-align:center;"><span style="color:#fbbf24;font-size:28px;font-weight:bold;">45</span><br/><span style="color:#767676;font-size:10px;text-transform:uppercase;">Min</span></td><td style="color:#ffffff;font-size:28px;padding:0 8px;">:</td><td style="background:#1a1a1a;border-radius:4px;padding:12px 18px;text-align:center;"><span style="color:#fbbf24;font-size:28px;font-weight:bold;">30</span><br/><span style="color:#767676;font-size:10px;text-transform:uppercase;">Seg</span></td></tr></table></div>', "30px 10px"),
      ])], "#000000"),
      makeImagiqFooter(),
    ], "#0a0a0a"),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Club VIP / Fidelidad ───
const loyaltyVipDesign = () => {
  idCounter = 700;
  return {
    counters: { u_row: 7, u_column: 9, u_content_text: 9, u_content_heading: 2, u_content_button: 1, u_content_divider: 1 },
    body: makeBody([
      makeImagiqHeader(),
      // Hero
      makeRow([makeColumn([
        makeText('<p style="text-align:center;color:#d4af37;font-size:12px;letter-spacing:4px;text-transform:uppercase;">EXCLUSIVO PARA MIEMBROS</p>', "35px 10px 10px"),
        makeHeading("Club VIP", { fontSize: "42px", color: "#ffffff", padding: "0px 10px 5px" }),
        makeText('<p style="text-align:center;color:#d1d5db;font-size:16px;">Tu lealtad merece recompensas premium</p>', "0px 10px 35px"),
      ])], "#1a1a1a"),
      // Status card
      makeRow([makeColumn([
        makeText('<div style="background:#1a1a1a;border-radius:12px;padding:30px;margin:0 20px;"><table style="width:100%;"><tr><td><p style="color:#767676;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Tu nivel actual</p><p style="color:#ffffff;font-size:24px;font-weight:bold;margin-top:5px;">ORO</p></td><td style="text-align:right;"><p style="color:#767676;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Puntos acumulados</p><p style="color:#fbbf24;font-size:28px;font-weight:bold;margin-top:5px;">4,520</p></td></tr></table><div style="background:#333333;border-radius:4px;height:8px;margin-top:20px;"><div style="background:linear-gradient(90deg,#fbbf24,#f59e0b);border-radius:4px;height:8px;width:75%;"></div></div><p style="color:#767676;font-size:12px;margin-top:8px;">480 puntos más para nivel <strong style="color:#fbbf24;">PLATINUM</strong></p></div>', "30px 10px 20px"),
      ])], "#ffffff"),
      // Benefits - 3 columns
      makeRow([
        makeColumn([
          makeText('<div style="text-align:center;padding:15px;"><p style="font-size:32px;margin-bottom:8px;">🎁</p><p style="font-weight:bold;color:#1a1a1a;font-size:15px;">Regalos Exclusivos</p><p style="color:#767676;font-size:13px;margin-top:5px;">Sorpresas cada mes solo para ti</p></div>', "10px"),
        ]),
        makeColumn([
          makeText('<div style="text-align:center;padding:15px;"><p style="font-size:32px;margin-bottom:8px;">🚀</p><p style="font-weight:bold;color:#1a1a1a;font-size:15px;">Envío Prioritario</p><p style="color:#767676;font-size:13px;margin-top:5px;">Recibe tus pedidos primero</p></div>', "10px"),
        ]),
        makeColumn([
          makeText('<div style="text-align:center;padding:15px;"><p style="font-size:32px;margin-bottom:8px;">💎</p><p style="font-weight:bold;color:#1a1a1a;font-size:15px;">Acceso Anticipado</p><p style="color:#767676;font-size:13px;margin-top:5px;">Compra antes que nadie</p></div>', "10px"),
        ]),
      ], "#ffffff"),
      // Exclusive offer
      makeRow([makeColumn([
        makeDivider({ padding: "0px 40px" }),
        makeText('<p style="text-align:center;color:#767676;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:5px;">OFERTA EXCLUSIVA VIP</p>', "25px 30px 0px"),
        makeHeading("20% Extra en Todo", { fontSize: "28px", color: "#1a1a1a", padding: "5px 30px 10px" }),
        makeText('<p style="text-align:center;color:#767676;font-size:15px;">Válido solo para miembros del Club VIP hasta el 28 de febrero.</p>', "0px 30px 15px"),
        makeButton("CANJEAR MI DESCUENTO", { href: `${IMAGIQ_URL}/ofertas`, padding: "10px 30px 30px" }),
      ])], "#ffffff"),
      // Points reminder
      makeRow([makeColumn([
        makeText('<div style="text-align:center;padding:10px;"><p style="color:#1a1a1a;font-size:13px;font-weight:bold;">Recuerda: cada $1 de compra = 10 puntos VIP</p></div>', "15px 10px"),
      ])], "#f8f8f8"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Solicitar Reseña ───
const reviewRequestDesign = () => {
  idCounter = 800;
  return {
    counters: { u_row: 5, u_column: 5, u_content_text: 6, u_content_heading: 1, u_content_button: 1 },
    body: makeBody([
      makeImagiqHeader(),
      // Main
      makeRow([makeColumn([
        makeText('<p style="text-align:center;font-size:48px;margin-bottom:0;">⭐</p>', "35px 10px 0px"),
        makeHeading("¿Qué te pareció tu compra?", { fontSize: "26px", padding: "10px 30px 10px" }),
        makeText('<p style="text-align:center;color:#767676;font-size:16px;line-height:1.6;">Hola <strong>[Nombre]</strong>, tu opinión es muy importante para nosotros y para otros compradores.</p>', "0px 30px 20px"),
      ])], "#ffffff"),
      // Product to review
      makeRow([makeColumn([
        makeText('<div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:8px;padding:25px;"><table style="width:100%;"><tr><td style="width:100px;vertical-align:top;"><div style="background:#e8e8e8;border-radius:8px;width:90px;height:90px;text-align:center;line-height:90px;font-size:32px;">📦</div></td><td style="padding-left:20px;vertical-align:top;"><p style="font-weight:bold;font-size:16px;color:#1a1a1a;">Nombre del Producto</p><p style="color:#767676;font-size:14px;margin-top:4px;">Pedido #12345 · Entregado el 10 Feb</p><p style="margin-top:12px;">⭐⭐⭐⭐⭐</p><p style="color:#767676;font-size:12px;margin-top:4px;">Toca las estrellas para calificar</p></td></tr></table></div>', "0px 25px 20px"),
        makeButton("ESCRIBIR RESEÑA", { href: IMAGIQ_URL, padding: "0px 25px 15px" }),
        makeText('<p style="text-align:center;color:#767676;font-size:13px;">Solo te tomará 2 minutos</p>', "0px 25px 30px"),
      ])], "#ffffff"),
      // Incentive
      makeRow([makeColumn([
        makeText('<div style="text-align:center;"><p style="font-size:24px;margin-bottom:8px;">🎉</p><p style="color:#1a1a1a;font-weight:bold;font-size:16px;">¡Gana 200 puntos por tu reseña!</p><p style="color:#767676;font-size:14px;margin-top:5px;">Además, si incluyes una foto, ganas <strong>100 puntos extra</strong>.</p></div>', "25px 30px"),
      ])], "#f8f8f8"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Envío en Camino ───
const shippingUpdateDesign = () => {
  idCounter = 900;
  return {
    counters: { u_row: 6, u_column: 6, u_content_text: 7, u_content_heading: 1, u_content_button: 1, u_content_divider: 1 },
    body: makeBody([
      makeImagiqHeader(),
      // Banner
      makeRow([makeColumn([
        makeText('<p style="text-align:center;font-size:40px;">📦</p>', "30px 10px 5px"),
        makeHeading("¡Tu pedido va en camino!", { fontSize: "28px", color: "#ffffff", padding: "0px 10px 5px" }),
        makeText('<p style="text-align:center;color:#d1d5db;font-size:15px;">Orden #ORD-2025-78456</p>', "0px 10px 30px"),
      ])], "#1a1a1a"),
      // Tracking steps
      makeRow([makeColumn([
        makeText('<div style="padding:25px 15px;"><table style="width:100%;"><tr><td style="width:40px;vertical-align:top;text-align:center;"><div style="background:#1a1a1a;border-radius:50%;width:28px;height:28px;line-height:28px;text-align:center;color:#fff;font-size:14px;font-weight:bold;">✓</div><div style="width:2px;height:30px;background:#1a1a1a;margin:4px auto;"></div></td><td style="padding-left:12px;padding-bottom:20px;"><p style="font-weight:bold;color:#1a1a1a;">Pedido confirmado</p><p style="color:#767676;font-size:13px;">10 Feb, 2025 — 14:30</p></td></tr><tr><td style="width:40px;vertical-align:top;text-align:center;"><div style="background:#1a1a1a;border-radius:50%;width:28px;height:28px;line-height:28px;text-align:center;color:#fff;font-size:14px;font-weight:bold;">✓</div><div style="width:2px;height:30px;background:#1a1a1a;margin:4px auto;"></div></td><td style="padding-left:12px;padding-bottom:20px;"><p style="font-weight:bold;color:#1a1a1a;">En preparación</p><p style="color:#767676;font-size:13px;">10 Feb, 2025 — 16:45</p></td></tr><tr><td style="width:40px;vertical-align:top;text-align:center;"><div style="background:#1a1a1a;border-radius:50%;width:28px;height:28px;line-height:28px;text-align:center;color:#fff;font-size:16px;">●</div><div style="width:2px;height:30px;background:#e8e8e8;margin:4px auto;"></div></td><td style="padding-left:12px;padding-bottom:20px;"><p style="font-weight:bold;color:#1a1a1a;">En tránsito</p><p style="color:#767676;font-size:13px;">11 Feb, 2025 — Tu paquete está en camino</p></td></tr><tr><td style="width:40px;vertical-align:top;text-align:center;"><div style="background:#e8e8e8;border-radius:50%;width:28px;height:28px;line-height:28px;text-align:center;color:#767676;font-size:14px;">4</div></td><td style="padding-left:12px;"><p style="color:#767676;">Entregado</p><p style="color:#d1d5db;font-size:13px;">Entrega estimada: 13 Feb</p></td></tr></table></div>', "10px 20px"),
      ])], "#ffffff"),
      // Delivery info
      makeRow([makeColumn([
        makeText('<div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:0 15px;"><table style="width:100%;"><tr><td style="width:50%;"><p style="color:#767676;font-size:12px;text-transform:uppercase;">Transportadora</p><p style="font-weight:bold;color:#1a1a1a;margin-top:4px;">Servientrega</p></td><td><p style="color:#767676;font-size:12px;text-transform:uppercase;">Guía de rastreo</p><p style="font-weight:bold;color:#1a1a1a;margin-top:4px;">SE-789456123</p></td></tr></table></div>', "10px 15px 20px"),
        makeButton("RASTREAR MI PEDIDO", { href: `${IMAGIQ_URL}/seguimiento`, padding: "0px 15px 30px" }),
      ])], "#ffffff"),
      // Product summary
      makeRow([makeColumn([
        makeDivider({ padding: "0px 30px" }),
        makeText('<p style="font-weight:bold;font-size:15px;color:#1a1a1a;margin-bottom:12px;">Lo que pediste:</p><table style="width:100%;"><tr><td style="padding:8px 0;border-bottom:1px solid #e8e8e8;"><span style="color:#1a1a1a;">Producto Ejemplo x1</span></td><td style="text-align:right;padding:8px 0;border-bottom:1px solid #e8e8e8;font-weight:bold;">$149.99</td></tr><tr><td style="padding:8px 0;"><span style="color:#1a1a1a;">Envío</span></td><td style="text-align:right;padding:8px 0;color:#1a1a1a;font-weight:bold;">Gratis</td></tr></table>', "20px 30px 30px"),
      ])], "#ffffff"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Colección de Temporada ───
const seasonalCollectionDesign = () => {
  idCounter = 1000;
  return {
    counters: { u_row: 7, u_column: 9, u_content_text: 7, u_content_heading: 2, u_content_button: 3, u_content_image: 3 },
    body: makeBody([
      makeImagiqHeader(),
      // Hero
      makeRow([makeColumn([
        makeImage("https://placehold.co/600x350/1a1a1a/ffffff?text=Nueva+Colección", { padding: "0px" }),
      ])]),
      // Title section
      makeRow([makeColumn([
        makeText('<p style="text-align:center;color:#767676;font-size:12px;letter-spacing:3px;text-transform:uppercase;">NUEVA TEMPORADA</p>', "35px 10px 5px"),
        makeHeading("Colección Verano 2025", { fontSize: "36px", color: "#1a1a1a", padding: "0px 10px 10px" }),
        makeText('<p style="text-align:center;color:#767676;font-size:16px;line-height:1.7;">Descubre las piezas más exclusivas de esta temporada. Diseños frescos, colores vibrantes y la mejor calidad para tu estilo.</p>', "0px 40px 25px"),
        makeButton("EXPLORAR COLECCIÓN", { href: IMAGIQ_URL, padding: "0px 30px 35px" }),
      ])], "#ffffff"),
      // Products - 2 columns
      makeRow([
        makeColumn([
          makeImage("https://placehold.co/280x350/f8f8f8/767676?text=Look+1", { padding: "0px" }),
          makeText('<p style="text-align:center;font-weight:bold;font-size:15px;color:#1a1a1a;margin-top:12px;">Conjunto Esencial</p><p style="text-align:center;color:#1a1a1a;font-size:18px;font-weight:bold;margin-top:4px;">$189.99</p>', "10px 15px 20px"),
          makeButton("Ver Detalles", { bgColor: "#ffffff", color: "#1a1a1a", href: IMAGIQ_URL, padding: "0px 15px 25px" }),
        ]),
        makeColumn([
          makeImage("https://placehold.co/280x350/f8f8f8/767676?text=Look+2", { padding: "0px" }),
          makeText('<p style="text-align:center;font-weight:bold;font-size:15px;color:#1a1a1a;margin-top:12px;">Vestido Premium</p><p style="text-align:center;color:#1a1a1a;font-size:18px;font-weight:bold;margin-top:4px;">$249.99</p>', "10px 15px 20px"),
          makeButton("Ver Detalles", { bgColor: "#ffffff", color: "#1a1a1a", href: IMAGIQ_URL, padding: "0px 15px 25px" }),
        ]),
      ], "#f8f8f8"),
      // Benefits strip
      makeRow([makeColumn([
        makeText('<table style="width:100%;"><tr><td style="text-align:center;padding:15px;width:33%;"><p style="font-size:20px;">🚚</p><p style="font-size:12px;color:#767676;margin-top:5px;font-weight:bold;">ENVÍO GRATIS<br/><span style="font-weight:normal;">+$100.000</span></p></td><td style="text-align:center;padding:15px;width:33%;border-left:1px solid #e8e8e8;border-right:1px solid #e8e8e8;"><p style="font-size:20px;">🔄</p><p style="font-size:12px;color:#767676;margin-top:5px;font-weight:bold;">DEVOLUCIONES<br/><span style="font-weight:normal;">30 días</span></p></td><td style="text-align:center;padding:15px;width:33%;"><p style="font-size:20px;">💳</p><p style="font-size:12px;color:#767676;margin-top:5px;font-weight:bold;">PAGO SEGURO<br/><span style="font-weight:normal;">100% protegido</span></p></td></tr></table>', "10px"),
      ])], "#f8f8f8"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Cupón de Descuento ───
const couponDesign = () => {
  idCounter = 1100;
  return {
    counters: { u_row: 5, u_column: 5, u_content_text: 6, u_content_heading: 1, u_content_button: 1 },
    body: makeBody([
      makeImagiqHeader(),
      // Coupon card
      makeRow([makeColumn([
        makeText('<p style="text-align:center;color:#767676;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">CUPÓN EXCLUSIVO PARA TI</p>', "40px 10px 10px"),
        makeText('<div style="background:#1a1a1a;border-radius:0;padding:35px 25px;margin:0 20px;text-align:center;"><p style="color:#767676;font-size:14px;text-transform:uppercase;letter-spacing:2px;">DESCUENTO ESPECIAL</p><p style="color:#ffffff;font-size:56px;font-weight:bold;margin:10px 0;">25% OFF</p><p style="color:#d1d5db;font-size:14px;margin-bottom:15px;">En toda la tienda</p><div style="background:#ffffff;border-radius:4px;padding:12px 25px;display:inline-block;"><p style="color:#1a1a1a;font-size:22px;font-weight:bold;letter-spacing:4px;font-family:monospace;">SAVE25VIP</p></div><p style="color:#767676;font-size:12px;margin-top:12px;">Válido hasta el 28 de febrero, 2025</p></div>', "10px 10px 20px"),
      ])], "#ffffff"),
      // Instructions
      makeRow([makeColumn([
        makeHeading("¿Cómo usar tu cupón?", { level: "h3", fontSize: "18px", padding: "25px 30px 15px" }),
        makeText('<table style="width:100%;"><tr><td style="padding:12px 0;border-bottom:1px solid #e8e8e8;"><table style="width:100%;"><tr><td style="width:40px;vertical-align:top;"><div style="background:#f8f8f8;border-radius:50%;width:32px;height:32px;line-height:32px;text-align:center;color:#1a1a1a;font-weight:bold;">1</div></td><td style="padding-left:12px;"><p style="font-weight:bold;color:#1a1a1a;font-size:14px;">Elige tus productos favoritos</p><p style="color:#767676;font-size:13px;">Explora toda nuestra tienda</p></td></tr></table></td></tr><tr><td style="padding:12px 0;border-bottom:1px solid #e8e8e8;"><table style="width:100%;"><tr><td style="width:40px;vertical-align:top;"><div style="background:#f8f8f8;border-radius:50%;width:32px;height:32px;line-height:32px;text-align:center;color:#1a1a1a;font-weight:bold;">2</div></td><td style="padding-left:12px;"><p style="font-weight:bold;color:#1a1a1a;font-size:14px;">Ingresa el código al pagar</p><p style="color:#767676;font-size:13px;">Copia: SAVE25VIP</p></td></tr></table></td></tr><tr><td style="padding:12px 0;"><table style="width:100%;"><tr><td style="width:40px;vertical-align:top;"><div style="background:#f8f8f8;border-radius:50%;width:32px;height:32px;line-height:32px;text-align:center;color:#1a1a1a;font-weight:bold;">3</div></td><td style="padding-left:12px;"><p style="font-weight:bold;color:#1a1a1a;font-size:14px;">¡Disfruta tu descuento!</p><p style="color:#767676;font-size:13px;">El descuento se aplica automáticamente</p></td></tr></table></td></tr></table>', "0px 30px 25px"),
        makeButton("IR A LA TIENDA", { href: IMAGIQ_URL, padding: "0px 30px 35px" }),
      ])], "#ffffff"),
      // Fine print
      makeRow([makeColumn([
        makeText('<p style="text-align:center;color:#767676;font-size:11px;">*Cupón válido para una sola compra. No acumulable con otras ofertas. Compra mínima de $50.000. Aplican términos y condiciones.</p>', "15px 30px"),
      ])], "#f8f8f8"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Invitación Evento ───
const eventInviteDesign = () => {
  idCounter = 1200;
  return {
    counters: { u_row: 6, u_column: 6, u_content_text: 7, u_content_heading: 1, u_content_button: 2, u_content_divider: 1 },
    body: makeBody([
      makeImagiqHeader(),
      // Hero
      makeRow([makeColumn([
        makeText('<p style="text-align:center;color:#fbbf24;font-size:12px;letter-spacing:3px;text-transform:uppercase;">ESTÁS INVITADO</p>', "45px 10px 10px"),
        makeHeading("Evento Exclusivo", { fontSize: "40px", color: "#ffffff", padding: "0px 10px 10px" }),
        makeText('<p style="text-align:center;color:#d1d5db;font-size:16px;line-height:1.6;">Una experiencia única que no te puedes perder</p>', "0px 30px 35px"),
      ])], "#1a1a1a"),
      // Event details
      makeRow([makeColumn([
        makeText('<table style="width:100%;"><tr><td style="text-align:center;padding:25px 15px;width:33%;"><p style="font-size:28px;margin-bottom:5px;">📅</p><p style="color:#767676;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Fecha</p><p style="font-weight:bold;color:#1a1a1a;font-size:16px;margin-top:4px;">15 Marzo</p><p style="color:#767676;font-size:13px;">2025</p></td><td style="text-align:center;padding:25px 15px;width:33%;border-left:1px solid #e8e8e8;border-right:1px solid #e8e8e8;"><p style="font-size:28px;margin-bottom:5px;">🕐</p><p style="color:#767676;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Hora</p><p style="font-weight:bold;color:#1a1a1a;font-size:16px;margin-top:4px;">7:00 PM</p><p style="color:#767676;font-size:13px;">Hora local</p></td><td style="text-align:center;padding:25px 15px;width:33%;"><p style="font-size:28px;margin-bottom:5px;">📍</p><p style="color:#767676;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Lugar</p><p style="font-weight:bold;color:#1a1a1a;font-size:16px;margin-top:4px;">Centro Conv.</p><p style="color:#767676;font-size:13px;">Salón Principal</p></td></tr></table>', "10px 10px"),
      ])], "#ffffff"),
      // Description
      makeRow([makeColumn([
        makeDivider({ padding: "0px 30px" }),
        makeText(`<p style="color:#1a1a1a;font-size:16px;line-height:1.7;">Querido <strong>[Nombre]</strong>,</p><p style="color:#767676;font-size:15px;line-height:1.7;margin-top:12px;">Te invitamos a un evento exclusivo donde descubrirás en primicia nuestros nuevos productos, disfrutarás de experiencias interactivas y conocerás al equipo detrás de la marca.</p><p style="color:#767676;font-size:15px;line-height:1.7;margin-top:12px;">El evento incluye:</p><ul style="color:#767676;font-size:15px;line-height:2;"><li>Lanzamiento de productos exclusivos</li><li>Descuentos especiales solo para asistentes</li><li>Networking y cóctel de bienvenida</li><li>Sorteos y regalos sorpresa</li></ul>`, "20px 30px 20px"),
        makeButton("CONFIRMAR ASISTENCIA", { href: IMAGIQ_URL, padding: "10px 30px 15px" }),
        makeButton("AGREGAR AL CALENDARIO", { bgColor: "#ffffff", color: "#1a1a1a", href: IMAGIQ_URL, padding: "5px 30px 35px" }),
      ])], "#ffffff"),
      // Dress code
      makeRow([makeColumn([
        makeText('<div style="text-align:center;"><p style="color:#1a1a1a;font-weight:bold;font-size:14px;">Código de vestimenta: <span style="color:#fbbf24;">Smart Casual</span></p><p style="color:#767676;font-size:13px;margin-top:5px;">Cupos limitados · Entrada con invitación</p></div>', "20px 10px"),
      ])], "#f8f8f8"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Reactivación de Cliente ───
const winBackDesign = () => {
  idCounter = 1300;
  return {
    counters: { u_row: 6, u_column: 6, u_content_text: 7, u_content_heading: 2, u_content_button: 1, u_content_divider: 1 },
    body: makeBody([
      makeImagiqHeader(),
      // Header
      makeRow([makeColumn([
        makeText('<p style="text-align:center;font-size:48px;">💔</p>', "35px 10px 5px"),
        makeHeading("¡Te extrañamos!", { fontSize: "34px", color: "#ffffff", padding: "0px 10px 10px" }),
        makeText('<p style="text-align:center;color:#d1d5db;font-size:16px;">Ha pasado un tiempo desde tu última visita</p>', "0px 10px 35px"),
      ])], "#1a1a1a"),
      // Body
      makeRow([makeColumn([
        makeText('<p style="color:#1a1a1a;font-size:16px;line-height:1.7;">Hola <strong>[Nombre]</strong>,</p><p style="color:#767676;font-size:16px;line-height:1.7;margin-top:10px;">Notamos que hace tiempo no nos visitas. Queremos que sepas que hemos estado trabajando en cosas increíbles que creemos te van a encantar.</p>', "35px 30px 20px"),
      ])], "#ffffff"),
      // Offer
      makeRow([makeColumn([
        makeText('<div style="background:#f8f8f8;border:2px dashed #d1d5db;border-radius:0;padding:30px;text-align:center;margin:0 15px;"><p style="color:#1a1a1a;font-size:13px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">OFERTA ESPECIAL DE REGRESO</p><p style="color:#1a1a1a;font-size:48px;font-weight:bold;margin:10px 0;">30% OFF</p><p style="color:#767676;font-size:15px;">En tu próxima compra</p><div style="background:#1a1a1a;border-radius:0;padding:10px 20px;display:inline-block;margin-top:15px;"><p style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:3px;font-family:monospace;">VUELVE30</p></div><p style="color:#767676;font-size:12px;margin-top:12px;">Válido por 7 días</p></div>', "0px 15px 25px"),
        makeButton("VOLVER A COMPRAR", { href: IMAGIQ_URL, padding: "0px 30px 15px" }),
        makeText(`<p style="text-align:center;color:#767676;font-size:14px;">Si ya no deseas recibir nuestros correos, lo entendemos.<br/>Puedes <a href="#" style="color:#1a1a1a;">cancelar tu suscripción aquí</a>.</p>`, "10px 30px 35px"),
      ])], "#ffffff"),
      // What's new
      makeRow([makeColumn([
        makeDivider({ padding: "0px 30px" }),
        makeHeading("Lo que te has perdido", { level: "h3", fontSize: "18px", padding: "20px 30px 15px" }),
        makeText('<table style="width:100%;"><tr><td style="padding:10px 0;"><span style="color:#1a1a1a;font-weight:bold;font-size:18px;">✦</span></td><td style="padding:10px 15px;"><p style="font-weight:bold;color:#1a1a1a;font-size:14px;">+50 nuevos productos</p><p style="color:#767676;font-size:13px;">Explorá las últimas novedades</p></td></tr><tr><td style="padding:10px 0;"><span style="color:#1a1a1a;font-weight:bold;font-size:18px;">✦</span></td><td style="padding:10px 15px;"><p style="font-weight:bold;color:#1a1a1a;font-size:14px;">Envío gratis mejorado</p><p style="color:#767676;font-size:13px;">Ahora en pedidos desde $30.000</p></td></tr><tr><td style="padding:10px 0;"><span style="color:#1a1a1a;font-weight:bold;font-size:18px;">✦</span></td><td style="padding:10px 15px;"><p style="font-weight:bold;color:#1a1a1a;font-size:14px;">Programa de puntos renovado</p><p style="color:#767676;font-size:13px;">Gana el doble de puntos este mes</p></td></tr></table>', "0px 30px 30px"),
      ])], "#ffffff"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ─── TEMPLATE: Catálogo Productos ───
const catalogShowcaseDesign = () => {
  idCounter = 1400;
  return {
    counters: { u_row: 7, u_column: 10, u_content_text: 9, u_content_heading: 1, u_content_button: 5, u_content_image: 4 },
    body: makeBody([
      makeImagiqHeader(),
      // Hero
      makeRow([makeColumn([
        makeText('<p style="text-align:center;color:#767676;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;">SELECCIÓN CURADA</p>', "35px 10px 5px"),
        makeHeading("Lo Más Vendido", { fontSize: "34px", padding: "0px 10px 8px" }),
        makeText('<p style="text-align:center;color:#767676;font-size:16px;">Los productos favoritos de nuestros clientes esta semana</p>', "0px 30px 30px"),
      ])], "#ffffff"),
      // Products row 1
      makeRow([
        makeColumn([
          makeImage("https://placehold.co/280x280/f8f8f8/767676?text=Top+1", { padding: "0px 10px 0px 0px" }),
          makeText('<p style="font-weight:bold;font-size:15px;color:#1a1a1a;margin-top:10px;">Producto Estrella</p><p style="color:#767676;font-size:13px;margin-top:2px;">Categoría</p><p style="margin-top:6px;"><span style="color:#1a1a1a;font-weight:bold;font-size:18px;">$129.900</span> <span style="color:#767676;text-decoration:line-through;font-size:13px;">$189.900</span></p>', "10px 10px 10px 0px"),
          makeButton("Agregar al Carrito", { href: IMAGIQ_URL, padding: "5px 10px 20px 0px" }),
        ]),
        makeColumn([
          makeImage("https://placehold.co/280x280/f8f8f8/767676?text=Top+2", { padding: "0px 0px 0px 10px" }),
          makeText('<p style="font-weight:bold;font-size:15px;color:#1a1a1a;margin-top:10px;">Producto Premium</p><p style="color:#767676;font-size:13px;margin-top:2px;">Categoría</p><p style="margin-top:6px;"><span style="color:#1a1a1a;font-weight:bold;font-size:18px;">$219.900</span></p>', "10px 0px 10px 10px"),
          makeButton("Agregar al Carrito", { href: IMAGIQ_URL, padding: "5px 0px 20px 10px" }),
        ]),
      ], "#ffffff"),
      // Products row 2
      makeRow([
        makeColumn([
          makeImage("https://placehold.co/280x280/f8f8f8/767676?text=Top+3", { padding: "0px 10px 0px 0px" }),
          makeText('<p style="font-weight:bold;font-size:15px;color:#1a1a1a;margin-top:10px;">Producto Tendencia</p><p style="color:#767676;font-size:13px;margin-top:2px;">Categoría</p><p style="margin-top:6px;"><span style="color:#1a1a1a;font-weight:bold;font-size:18px;">$89.900</span></p>', "10px 10px 10px 0px"),
          makeButton("Agregar al Carrito", { href: IMAGIQ_URL, padding: "5px 10px 20px 0px" }),
        ]),
        makeColumn([
          makeImage("https://placehold.co/280x280/f8f8f8/767676?text=Top+4", { padding: "0px 0px 0px 10px" }),
          makeText('<p style="font-weight:bold;font-size:15px;color:#1a1a1a;margin-top:10px;">Producto Nuevo</p><p style="color:#767676;font-size:13px;margin-top:2px;">Categoría</p><p style="margin-top:6px;"><span style="color:#1a1a1a;font-weight:bold;font-size:18px;">$159.900</span> <span style="background:#1a1a1a;color:#fff;font-size:11px;padding:2px 8px;border-radius:0;font-weight:bold;">-20%</span></p>', "10px 0px 10px 10px"),
          makeButton("Agregar al Carrito", { href: IMAGIQ_URL, padding: "5px 0px 20px 10px" }),
        ]),
      ], "#ffffff"),
      // Free shipping banner
      makeRow([makeColumn([
        makeText('<div style="text-align:center;"><p style="color:#ffffff;font-size:15px;font-weight:bold;">🚚 ENVÍO GRATIS en pedidos mayores a $100.000</p></div>', "15px 10px"),
      ])], "#1a1a1a"),
      makeImagiqFooter(),
    ]),
    schemaVersion: 16,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const predefinedUnlayerTemplates: PredefinedTemplate[] = [
  {
    id: "unlayer-promo-sale",
    name: "Promoción Venta",
    subject: "¡Oferta especial! Hasta 50% de descuento",
    category: "e-commerce",
    design: promoSaleDesign(),
  },
  {
    id: "unlayer-new-product",
    name: "Nuevo Producto",
    subject: "¡Nuevo producto disponible!",
    category: "e-commerce",
    design: newProductDesign(),
  },
  {
    id: "unlayer-welcome",
    name: "Bienvenida",
    subject: "¡Bienvenido a nuestra comunidad!",
    category: "e-commerce",
    design: welcomeDesign(),
  },
  {
    id: "unlayer-abandoned-cart",
    name: "Carrito Abandonado",
    subject: "¡Olvidaste algo en tu carrito!",
    category: "e-commerce",
    design: abandonedCartDesign(),
  },
  {
    id: "unlayer-order-confirm",
    name: "Confirmación de Pedido",
    subject: "Confirmación de Pedido",
    category: "e-commerce",
    design: orderConfirmDesign(),
  },
  {
    id: "unlayer-newsletter",
    name: "Newsletter",
    subject: "Las novedades de esta semana",
    category: "e-commerce",
    design: newsletterDesign(),
  },
  {
    id: "unlayer-flash-sale",
    name: "Venta Relámpago",
    subject: "SOLO HOY: Hasta 70% OFF en todo",
    category: "e-commerce",
    design: flashSaleDesign(),
  },
  {
    id: "unlayer-loyalty-vip",
    name: "Club VIP / Fidelidad",
    subject: "Tus recompensas VIP te esperan",
    category: "e-commerce",
    design: loyaltyVipDesign(),
  },
  {
    id: "unlayer-review-request",
    name: "Solicitar Reseña",
    subject: "¿Qué te pareció tu compra?",
    category: "e-commerce",
    design: reviewRequestDesign(),
  },
  {
    id: "unlayer-shipping-update",
    name: "Envío en Camino",
    subject: "¡Tu pedido va en camino!",
    category: "e-commerce",
    design: shippingUpdateDesign(),
  },
  {
    id: "unlayer-seasonal-collection",
    name: "Colección Temporada",
    subject: "Descubre la nueva colección Verano 2025",
    category: "e-commerce",
    design: seasonalCollectionDesign(),
  },
  {
    id: "unlayer-coupon",
    name: "Cupón de Descuento",
    subject: "Tu cupón de 25% OFF está aquí",
    category: "e-commerce",
    design: couponDesign(),
  },
  {
    id: "unlayer-event-invite",
    name: "Invitación Evento",
    subject: "Estás invitado a un evento exclusivo",
    category: "e-commerce",
    design: eventInviteDesign(),
  },
  {
    id: "unlayer-win-back",
    name: "Reactivación Cliente",
    subject: "¡Te extrañamos! Vuelve con 30% OFF",
    category: "e-commerce",
    design: winBackDesign(),
  },
  {
    id: "unlayer-catalog-showcase",
    name: "Catálogo Productos",
    subject: "Los más vendidos de esta semana",
    category: "e-commerce",
    design: catalogShowcaseDesign(),
  },
];
