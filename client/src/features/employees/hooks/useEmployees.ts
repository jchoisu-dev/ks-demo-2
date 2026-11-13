import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchEmployees } from "../services";
import type { getEmployeesParams } from '../employee.types';
export const useGetEmployees = ({ page, search }: getEmployeesParams) => {
  return useQuery({
    queryKey: ["employees", page, search],
    queryFn: () => fetchEmployees({page, search}),
    placeholderData: keepPreviousData
  });
};