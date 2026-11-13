import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchEmployeeAttendance } from "../services";
export const useGetEmployeeAttendance = (employeeId: string, date: string) => {
  return useQuery({
    queryKey: ["employee-attendance", employeeId, date],
    queryFn: () => fetchEmployeeAttendance(employeeId, date),
  });
};