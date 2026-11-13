import axios from "@/shared/api/axios";
import { Employee, EmployeeSearch } from "../employee.types";
import { PaginatedResponse } from '@/shared/api/types';
const getEmployees = async ( page: number, search: EmployeeSearch ): Promise<PaginatedResponse<Employee[]>> => {
  const { data } = await axios.get("/employee", {
    params: {
      page,
      ...search
    }
  });
  return data;
};
const getEmployee = async (id: string): Promise<Employee> => {
  const { data } = await axios.get(`/employee/${id}`);
  return data;
};
const createEmployee = async (payload: any) => {
  const { data } = await axios.post("/employee", payload);
  return data;
};
const updateEmployee = async (payload: any) => {
  const employeeId = payload.employeeId;
  const { data } = await axios.put(`/employee/${employeeId}`, payload);
  return data;
};
const deleteEmployee = async (id: string) => {
  const { data } = await axios.delete(`/employee/${id}`);
  return data;
};

export default {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
}