export type Role = 'ADMIN' | 'VENDEDOR';

export type User = {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  active: boolean;
  lastLoginAt: number | null;
  createdAt: number;
};
