export interface Pagination {
  size: number;
  page: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  reqId: string;
  status: 'T' | 'F';
  message: string;
  data: T;
  pagination?: Pagination;
}
