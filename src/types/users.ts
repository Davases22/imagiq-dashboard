

export type Permission =
  | 'users.create'
  | 'users.read'
  | 'users.update'
  | 'users.delete'
  | 'campaigns.create'
  | 'campaigns.read'
  | 'campaigns.update'
  | 'campaigns.delete'
  | 'analytics.read'
  | 'settings.read'
  | 'settings.update'
  | 'products.create'
  | 'products.read'
  | 'products.update'
  | 'products.delete'
  | 'orders.read'
  | 'orders.update'
  | 'customers.read'
  | 'customers.update';

// Estructura que realmente envía el backend
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  rol: number; // 1-4 según el backend (1=Admin, 2=Usuario, 3=Invitado, 4=Super Admin)
  permissions?: Permission[]; // Opcional, se mapea desde rol
  status?: 'active' | 'inactive' | 'pending' | 'suspended'; // Datos mock/frontend
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  department?: string;
  phoneNumber?: string;
  location?: string;
  timezone?: string;
  twoFactorEnabled?: boolean;
  loginAttempts?: number;
  lastActivity?: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}

export interface UserFilters {
  search?: string;
  rol?: number;
  status?: User['status'] | 'all';
  department?: string | 'all';
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  newUsersThisMonth: number;
  adminUsers?: number;       // rol_1
  regularUsers?: number;     // rol_2
  guestUsers?: number;       // rol_3
  superAdminUsers?: number;  // rol_4
}

// Tipos para la API de permisos
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';
export type PermissionResource = 'usuarios' | 'ordenes' | 'productos' | 'marketing' | 'envios' | 'atencion_cliente' | 'pagina_web' | 'metricas'  |'punto_fisico' |'bodega'| 'zonas_de_cobertura' | 'facturacion';

export interface PermissionItem {
  recurso: PermissionResource;
  accion: PermissionAction;
  permitido: boolean;
}

export interface UpdatePermissionsPayload {
  userId: string;
  permisos: PermissionItem[];
}