import api from "../api";
import type { UpdateAttendancePayload } from "../attendance.types";
export const fetchAttendences = async (calendarWeek: string) => {
  const attendances = await api.getAttendances(calendarWeek);
  return attendances;
};
export const fetchAllShifts = async () => {
  const shifts = await api.getAllShifts();
  return shifts;
};
export const fetchEmployeeAttendance = async (employeeId: string, date: string) => {
  const attendances = await api.getEmployeeAttendance(employeeId, date);
  return attendances;
};
export const createAttendance = async (payload: any) => {
  const attendances = await api.createAttendance(payload);
  return attendances;
};
export const deleteAttendance = async (attendanceId: string) => {
  const attendance = await api.deleteAttendance(attendanceId);
  return attendance;
};
export const updateAttendance = async (payload: UpdateAttendancePayload) => {
  const attendance = await api.updateAttendance(payload);
  return attendance;
};
export default {
  fetchAttendences,
  updateAttendance,
  createAttendance,
  fetchEmployeeAttendance,
  deleteAttendance
}