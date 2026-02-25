export interface Product {
  id: string; // codigoMarketBase
  codigoMarket: string[];
  name: string; // nombreMarket
  modelo: string;
  description?: string; // descGeneral
  desDetallada: string[];
  price: number; // precioNormal[0]
  precioDescto: number[];
  stock: number; // stock[0]
  category: string; // categoria
  menu: string;
  color: string[];
  capacidad: string[];
  sku: string[];
  status: 'active' | 'inactive' | 'draft';
  image?: string; // urlImagenes[0]
  urlImagenes: string[];
  urlRender3D: string[];
  fechaInicioVigencia: string[];
  fechaFinalVigencia: string[];
}

// Website Categories
export interface WebsiteCategory {
  id: string;
  name: string;
  nombreVisible?: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
  isActive: boolean;
  productsCount?: number;
  menus: WebsiteMenu[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WebsiteMenu {
  id: string;
  categoryId: string;
  name: string;
  nombreVisible?: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
  isActive: boolean;
  productsCount?: number;
  submenus: WebsiteSubmenu[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WebsiteSubmenu {
  id: string;
  menuId: string;
  name: string;
  nombreVisible?: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
  isActive: boolean;
  productsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Analytics
export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar?: string;

  // Segmentation
  segment: CustomerSegment;
  tags: string[];

  // Lifecycle
  status: 'active' | 'inactive' | 'churned' | 'new';
  lifecycleStage: 'lead' | 'prospect' | 'customer' | 'loyal' | 'at_risk' | 'churned';

  // Engagement metrics
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  firstOrderDate?: Date;

  // Behavior metrics (from PostHog)
  sessionsCount: number;
  pageviewsCount: number;
  avgSessionDuration: number;
  lastSeenAt?: Date;

  // Device & Location
  device?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  country?: string;
  city?: string;

  // Marketing attribution
  acquisitionSource?: string;
  acquisitionMedium?: string;
  acquisitionCampaign?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerSegment =
  | 'vip'           // High value, frequent buyers
  | 'loyal'         // Regular repeat customers
  | 'promising'     // New customers with high potential
  | 'at_risk'       // Previously active, now declining
  | 'hibernating'   // Haven't purchased in long time
  | 'lost'          // Churned customers
  | 'new'           // First-time visitors/buyers

export interface CustomerCohort {
  id: string;
  name: string;
  description?: string;
  conditions: CohortCondition[];
  customersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CohortCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface CustomerJourney {
  customerId: string;
  events: JourneyEvent[];
}

export interface JourneyEvent {
  id: string;
  type: 'pageview' | 'purchase' | 'cart_add' | 'email_open' | 'ad_click' | 'custom';
  timestamp: Date;
  properties?: Record<string, any>;
}

export interface CustomerInsight {
  type: 'funnel' | 'retention' | 'path' | 'trend';
  data: any;
  generatedAt: Date;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash' | 'other';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';

export interface Order {
  id: string;
  orderNumber: string;

  // Customer info
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;

  // Order details
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;

  // Status tracking
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;

  // Payment info
  paymentMethod: PaymentMethod;
  paymentMethodDisplay: string;
  transactionId?: string;

  // Shipping info
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;

  // Metadata
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  source?: 'web' | 'mobile' | 'physical_store' | 'phone';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  variant?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CustomerSimple {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalSpent: number;
  ordersCount: number;
  segment: 'vip' | 'regular' | 'new' | 'inactive';
  lastOrder?: Date;
  createdAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp' | 'in-web';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'sending' | 'failed';
  reach: number;
  clicks: number;
  conversions: number;
  createdAt: Date;
  subject?: string;
  totalRecipients?: number;
  successfulSends?: number;
  failedSends?: number;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  header: {
    type: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
    content: string;
  };
  body: string;
  footer: string;
  buttons: Array<{
    id: number;
    type: 'QUICK_REPLY' | 'PHONE_NUMBER' | 'URL';
    text: string;
    phoneNumber?: string;
    url?: string;
  }>;
  variables?: string[]; // Variables from the template
  metrics: {
    sent: number;
    delivered: number;
    read: number;
    clicks: number;
    conversions: number;
    openRate: number;
    ctr: number;
    conversionRate: number;
  };
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardMetrics {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  conversionRate: number;
  salesGrowth: number;
  ordersGrowth: number;
}

// Backend WhatsApp Template Response
export interface BackendWhatsAppTemplate {
  id: string;
  id_template?: string;
  name: string; // Primary field name
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: string;
  components?: Array<{ // Array of components (not JSON string)
    type: string;
    text?: string;
    example?: any;
    buttons?: Array<{
      text: string;
      type: string;
      phoneNumber?: string;
      url?: string;
    }>;
  }>;
  componentes?: string; // Legacy JSON string format
  quality_score?: {
    score: string;
    date: number;
  };
  puntuacion_calidad?: string;
  rejected_reason?: string;
  razon_rechazo?: string;
  variables?: string[]; // New field
  preview_text?: string; // New field
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  mensajes_enviados?: number;
  mensajes_fallidos?: number;
  mensajes_entregados?: number;
  mensajes_leidos?: number;
  clics_enlaces?: number;
  fecha_ultimo_uso?: string | null;
}

// Parsed component from JSON
export interface ParsedComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  text?: string;
  example?: any;
  buttons?: Array<{
    text: string;
    type: 'QUICK_REPLY' | 'PHONE_NUMBER' | 'URL';
    phoneNumber?: string;
    url?: string;
  }>;
}

// Backend API Types for Categories
export interface BackendCategory {
  uuid: string;
  nombre: string;
  nombreVisible?: string;
  descripcion: string;
  imagen: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  menus: BackendMenu[];
  totalProducts: number;
}

export interface BackendMenu {
  uuid: string;
  nombre: string;
  nombreVisible?: string;
  descripcion: string;
  imagen: string;
  activo: boolean;
  orden: number;
  categoriasVisiblesId: string;
  createdAt: string;
  updatedAt: string;
  totalProducts?: number;
  submenus?: BackendSubmenu[];
}

export interface BackendSubmenu {
  uuid: string;
  nombre: string;
  nombreVisible?: string;
  descripcion: string;
  imagen: string;
  activo: boolean;
  menusVisiblesId: string;
  createdAt: string;
  updatedAt: string;
  totalProducts?: number;
}

// Types for creating categories
export interface CreateCategoryRequest {
  nombre: string;
  descripcion: string;
  imagen: string;
  activo: boolean;
}

export interface UpdateCategoryRequest {
  nombre: string;
  nombreVisible: string;
  descripcion: string;
  imagen: string;
}

export interface CreateCategoryResponse {
  success: boolean;
  message?: string;
  data?: BackendCategory;
}

// Types for creating menus
export interface CreateMenuRequest {
  nombre: string;
  descripcion: string;
  imagen: string;
  activo: boolean;
}

export interface UpdateMenuRequest {
  nombre: string;
  nombreVisible: string;
  descripcion: string;
  imagen: string;
}

// Types for creating submenus
export interface CreateSubmenuRequest {
  nombre: string;
  descripcion: string;
  imagen: string;
  activo: boolean;
}

export interface UpdateSubmenuRequest {
  nombre: string;
  nombreVisible: string;
  descripcion: string;
  imagen: string;
}

// Payment Processors
export type PaymentProcessor = 'epayco' | 'mercadopago';

export interface PaymentProcessorConfig {
  id: PaymentProcessor;
  name: string;
  logo: string;
  logoDark?: string;
  enabled: boolean;
  description: string;
}