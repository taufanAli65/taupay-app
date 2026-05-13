import { MerchantProfile } from './merchant.model';

export interface ProductCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
  imageUrl: string;
  stock: number;
  merchant: MerchantProfile;
  category: ProductCategory;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  description?: string;
  stock: number;
  categoryId?: string;
}
