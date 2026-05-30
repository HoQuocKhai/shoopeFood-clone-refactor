export type UserRole = 'CUSTOMER' | 'DRIVER' | 'MERCHANT' | 'ADMIN';

export type LoginPayload = {
  phone: string;
  password: string;
  role: UserRole;
};

export type AuthUser = {
  id: number;
  fullName: string;
  phone: string;
  ratingAvg: number;
  roles: UserRole[];
  role: UserRole;
  createdAt?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};
