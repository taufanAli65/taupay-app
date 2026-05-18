export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  birthDate: string;
  isActive: boolean;
  balance: number;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  address?: string;
  birthDate?: string;
  pin?: string;
}
