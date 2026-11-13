import { useQuery, keepPreviousData } from "@tanstack/react-query";
import service from "../services";
export const useGetAdjustment = ({ employeeId, month, page }: { employeeId: string; month: string; page: number }) => {
  return useQuery({
    queryKey: ["adjustments", employeeId, month, page],
    queryFn: () => service.getAdjustments({ employeeId, month, page }),
    enabled: Boolean(employeeId),
    placeholderData: keepPreviousData
  });
};
