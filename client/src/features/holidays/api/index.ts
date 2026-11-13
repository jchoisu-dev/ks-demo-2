import axios from "@/shared/api/axios";
import { HolidayRows, HolidaySearch } from "../holidays.types";
import { PaginatedResponse } from '@/shared/api/types';
const getHolidays = async (page: number, search: HolidaySearch): Promise<PaginatedResponse<HolidayRows[]>> => {
  const { data } = await axios.get("/holiday", {
    params: { page, ...search }
  });
  return data;
};
const getHoliday = async (id: string): Promise<HolidayRows> => {
  const { data } = await axios.get(`/holiday/${id}`);
  return data;
};
const createHoliday = async (payload: any) => {
  const { data } = await axios.post("/holiday", payload);
  return data;
};
const updateHoliday = async (payload: any) => {
  const holidayId = payload.holidayId;
  const { data } = await axios.put(`/holiday/${holidayId}`, payload);
  return data;
};
const deleteHoliday = async (id: string) => {
  const { data } = await axios.delete(`/holiday/${id}`);
  return data;
};
export default {
  getHolidays,
  getHoliday,
  createHoliday,
  updateHoliday,
  deleteHoliday
}