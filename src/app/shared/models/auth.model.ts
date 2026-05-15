export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterUserRequest {
  firstName: string;
  lastName: string;
  address: string;
  birthDate: string;
  email: string;
  password: string;
}

export interface RegisterMerchantRequest {
  name: string;
  address: string;
  categoryId: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user?: UserAuthProfile;
  merchant?: MerchantAuthProfile;
  token: string;
}

export interface UserAuthProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  birthDate: string;
  isActive: boolean;
}

export interface MerchantAuthProfile {
  id: string;
  name: string;
  email: string;
  address: string;
  categoryId: string;
  categoryName: string;
  active: boolean;
}

export type UserRole = 'USER' | 'MERCHANT' | 'SUPER_ADMIN';

export interface JwtPayload {
  sub: string;         // email
  profileId: string;   // user/merchant UUID
  role: UserRole;
  iat: number;
  exp: number;
}
