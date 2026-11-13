import api from "../api";
import type { getShiftsParams } from "../shifts.types";
export const fetchShifts = async ({ page, search }: getShiftsParams) => {
  const shifts = await api.getShifts(page, search);
  return shifts;
};
export const fetchOneShift = async (id: string) => {
  const shift = await api.getShift(id);
  return shift;
};
export const createShift = async (payload: any) => {
  const shifts = await api.createShift(payload);
  return shifts;
};
export const updateShift = async (payload: any) => {
  const shifts = await api.updateShift(payload);
  return shifts;
};
export const deleteShift = async (id: string) => {
  const shifts = await api.deleteShift(id);
  return shifts;
};
export default {
  fetchShifts,
  fetchOneShift,
  createShift,
  updateShift,
  deleteShift
}