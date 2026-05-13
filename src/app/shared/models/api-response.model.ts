export interface Pagination {
  size: number;
  page: number;
}

export interface ApiResponse<T> {
  reqId: string;
  status: 'T' | 'F';
  message: string;
  data: T;
  pagination?: Pagination;
}
