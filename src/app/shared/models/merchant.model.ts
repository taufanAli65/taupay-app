export interface MerchantProfile {
  id: string;
  name: string;
  email: string;
  address: string;
  categoryId: string;
  categoryName: string;
  active: boolean;
  balance: number;
}

export interface MerchantCategory {
  id: string;
  name: string;
}

export interface UpdateMerchantRequest {
  name: string;
  categoryId: string;
  address: string;
  pin?: string;
}

export interface CreateMerchantRequest {
  name: string;
  address: string;
  categoryId: string;
  email: string;
  password: string;
}

export interface DashboardFinancial {
  todayRevenue: number;
  todayOrders: number;
  yesterdayRevenue: number;
  yesterdayOrders: number;
  averageOrderValue: number;
  activeProducts: number;
  totalProducts: number;
  deactivatedProducts: number;
  lowStockCount: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
}

export interface TopProduct {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface LowStockProduct {
  productId: string;
  productName: string;
  stock: number;
}

export interface MerchantDashboardData {
  financial: DashboardFinancial;
  revenueTrend: DailyRevenue[];
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
}
