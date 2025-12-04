export interface DashboardMetrics {
  sales: Sales;
  newUsers: NewUsers;
  monthlySales: MonthlySale[];
  topProducts: TopProduct[];
  paymentMethods: PaymentMethod[];
  ordenes: Orden[];
}

export interface Sales {
  current_count: string;
  previous_count: string;
  percent_difference: string;
  current_sales: number | null;
  previous_sales: number | null;
  sales_difference: number | null;
}

export interface NewUsers {
  current_count: string;
  previous_count: string;
  percent_difference: string;
}

export interface MonthlySale {
  month: string;
  sales: number;
  orders: number;
}

export interface TopProduct {
  total_vendidos: string;
  sku: string;
  desdetallada: string;
  ingresos_generados: number;
}

export interface PaymentMethod {
  nombre: string;
  percent: number;
  cantidad_ordenes: number;
  valor_vendido: number;
  total_vendido: number;
}

export interface Orden {
  serial_id: string;
  cliente: string;
  estado: string;
  fecha_creacion: string;
  age: string;
  total_amount: number;
}
