import api from "../api";
import type { getHolidaysParams } from "../holidays.types";
export const fetchHolidays = async({page, search}: getHolidaysParams) => {
  const holidays = await api.getHolidays(page, search);
  return holidays;
};
export const fetchOneHoliday = async(id: string) => {
  const shift = await api.getHoliday(id);
  return shift;
};
export const createHoliday = async(payload: any) => {
  const holidays = await api.createHoliday(payload);
  return holidays;
};
export const updateHoliday = async(payload: any) => {
  const holidays = await api.updateHoliday(payload);
  return holidays;
};
export const deleteHoliday = async(id: string) => {
  const holidays = await api.deleteHoliday(id);
  return holidays;
};
export default {
  fetchHolidays,
  fetchOneHoliday,
  createHoliday,
  updateHoliday,
  deleteHoliday
}