import axios from "@/shared/api/axios";
import { ShiftRows, ShiftSearch } from "../shifts.types";
import { PaginatedResponse } from '@/shared/api/types';
const getShifts = async (page: number, search: ShiftSearch): Promise<PaginatedResponse<ShiftRows[]>> => {
  const { data } = await axios.get("/settings/shifts", {
    params: { page, ...search }
  });
  return data;
};
const getShift = async (id: string): Promise<ShiftRows> => {
  const { data } = await axios.get(`/settings/shifts/${id}`);
  return data;
};
const createShift = async (payload: any) => {
  const { data } = await axios.post("/settings/shifts", payload);
  return data;
};
const updateShift = async (payload: any) => {
  const shiftId = payload.shiftId;
  const { data } = await axios.put(`/settings/shifts/${shiftId}`, payload);
  return data;
};
const deleteShift = async (id: string) => {
  const { data } = await axios.delete(`/settings/shifts/${id}`);
  return data;
};

export default {
  getShifts,
  getShift,
  createShift,
  updateShift,
  deleteShift
}