import { useAppSelector } from "@/app/store";
export const ROLE_ADMIN = "admin";
export const EDITOR_ROLES = ["admin", "payroll", "manager"];
export const homePath = (_role?: string) => "/dashboard";
export const usePermissions = () => {
  const role = useAppSelector((state) => state.auth.role) || "";
  return {
    role,
    isAdmin: role == ROLE_ADMIN,
    canEdit: EDITOR_ROLES.includes(role)
  };
};
