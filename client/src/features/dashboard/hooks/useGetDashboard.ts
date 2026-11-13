import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchDashboard } from "../services";
export const useGetDashboard = (month: string) => {
  return useQuery({
    queryKey: ["dashboard", month],
    queryFn: () => fetchDashboard(month),
    placeholderData: keepPreviousData
  });
};
