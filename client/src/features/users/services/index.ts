import api from "../api";
import type { StaffUserPayload, GetUsersParams } from '../users.types';
export const fetchUsers = async (params: GetUsersParams) => {
  const users = await api.getUsers(params);
  return users;
};
export const saveUser = async ({ id, payload }: { id: string | null; payload: StaffUserPayload }) => {
  const user = id ? await api.updateUser(id, payload) : await api.createUser(payload);
  return user;
};
export const resetPassword = async ({ id, password }: { id: string; password: string }) => {
  const user = await api.resetPassword(id, password);
  return user;
};
export const deleteUser = async (id: string) => {
  const result = await api.deleteUser(id);
  return result;
};
export default {
  fetchUsers,
  saveUser,
  resetPassword,
  deleteUser
}
