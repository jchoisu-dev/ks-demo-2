import axios from "@/shared/api/axios";
import type { Attendances, EmployeeAttendanceEntry, UpdateAttendancePayload } from "../attendance.types";
const getAttendances = async (calendarWeek: string): Promise<Attendances> => {
  const { data } = await axios.get("/attendance", {
    params: { calendarWeek }
  });
  return data;
};
const getAllShifts = async () => {
  const { data } = await axios.get("/settings/shifts/all");
  return data;
};
const getEmployeeAttendance = async (employeeId: string, date: string): Promise<EmployeeAttendanceEntry[]> => {
  const { data } = await axios.get(`/attendance/${employeeId}`, {
    params: { date }
  });
  return data;
};
const createAttendance = async (payload: any) => {
  const { data } = await axios.post("/attendance", payload);
  return data;
};
const updateAttendance = async ({ id, ...payload }: UpdateAttendancePayload): Promise<EmployeeAttendanceEntry> => {
  const { data } = await axios.put(`/attendance/${id}`, payload);
  return data;
};
const deleteAttendance = async (attendanceId: string) => {
  const { data } = await axios.delete(`/attendance/${attendanceId}`);
  return data;
};
export default {
  getAttendances,
  getAllShifts,
  getEmployeeAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance
}