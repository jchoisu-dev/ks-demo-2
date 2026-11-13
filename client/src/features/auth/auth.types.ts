export type User = {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  profileImage?: string;
  active?: boolean | undefined;
  mustChangePassword?: boolean;
  token?: string;
}
export type Profile = Omit<User, "token">;
export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
}
export type LoginPayload = {
  email: string;
  password: string;
}
export type LoginResponse = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImage: string;
  active: boolean;
  mustChangePassword?: boolean;
  token: string;
}