import axios from "@/shared/api/axios";
import type { StaffUser, StaffUsers, StaffUserPayload, GetUsersParams } from '../users.types';
const getUsers = async ({ page, q }: GetUsersParams): Promise<StaffUsers> => {
  const { data } = await axios.get("/users", { params: { page, q: q || undefined } });
  return data;
};
const createUser = async (payload: StaffUserPayload): Promise<StaffUser> => {
  const { data } = await axios.post("/users", payload);
  return data;
};
const updateUser = async (id: string, payload: StaffUserPayload): Promise<StaffUser> => {
  const { data } = await axios.put(`/users/${id}`, payload);
  return data;
};
const resetPassword = async (id: string, password: string): Promise<StaffUser> => {
  const { data } = await axios.put(`/users/${id}/password`, { password });
  return data;
};
const deleteUser = async (id: string) => {
  const { data } = await axios.delete(`/users/${id}`);
  return data;
};
export default {
  getUsers,
  createUser,
  updateUser,
  resetPassword,
  deleteUser
}
