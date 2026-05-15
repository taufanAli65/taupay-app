export interface ProductItem {
  product_id: string;
  quantity: number;
}

export interface CreateTransactionRequest {
  products: ProductItem[];
}

export interface TransactionProduct {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Transaction {
  trx_id: string;
  merchant_id: string;
  created_at: string;
  products: TransactionProduct[];
  total: number;
}

export type TransactionTerminalStatus = 'PAID' | 'FAILED' | 'EXPIRED';

export interface TransactionStatusEvent {
  trx_id: string;
  status: TransactionTerminalStatus;
  total: number;
}

export interface TransactionHistoryItem {
  historyId?: string;
  trx_id?: string;
  amount?: number;
  counterpartyName?: string;
  category?: string;
  createdAt?: string;
  created_at?: string;
  products?: TransactionProduct[];
}

export interface PaymentCallback {
  trx_id: string;
  status: string;
  payer_user_id: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}
