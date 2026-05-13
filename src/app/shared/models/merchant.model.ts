export interface MerchantProfile {
  id: string;
  name: string;
  email: string;
  address: string;
  categoryId: string;
  categoryName: string;
  active: boolean;
}

export interface MerchantCategory {
  id: string;
  name: string;
}

export interface UpdateMerchantRequest {
  name: string;
  categoryId: string;
  address: string;
}

export interface CreateMerchantRequest {
  name: string;
  address: string;
  categoryId: string;
  email: string;
  password: string;
}
