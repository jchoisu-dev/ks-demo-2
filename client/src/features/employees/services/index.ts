import api from "../api";
import type { getEmployeesParams } from "../employee.types";
export const fetchEmployees = async ({ page, search }: getEmployeesParams) => {
  const employees = await api.getEmployees(page, search);
  return employees;
};
export const fetchOneEmployee = async (id: string) => {
  const employees = await api.getEmployee(id);
  return employees;
};
export const createEmployee = async (payload: any) => {
  const employees = await api.createEmployee(payload);
  return employees;
};
export const updateEmployee = async (payload: any) => {
  const employees = await api.updateEmployee(payload);
  return employees;
};
export const deleteEmployee = async (id: string) => {
  const employees = await api.deleteEmployee(id);
  return employees;
};
export default {
  fetchEmployees,
  fetchOneEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
}