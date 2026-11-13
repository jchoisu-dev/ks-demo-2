import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchAdjustments } from "../services";
export const useDashboardAdjustments = (params: { month: string; page: number }) => {
  return useQuery({
    queryKey: ["dashboard", "adjustments", params],
    queryFn: () => fetchAdjustments(params),
    placeholderData: keepPreviousData
  });
};
