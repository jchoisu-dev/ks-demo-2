export type StaffRole = "admin" | "payroll" | "viewer" | "manager";
export type StaffUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
}
export type StaffUserPayload = Partial<Pick<StaffUser, "firstName" | "lastName" | "email" | "role" | "active">> & {
  password?: string;
}
export type StaffUsers = {
  data: StaffUser[];
  meta: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
export type GetUsersParams = {
  page: number;
  q: string;
}
