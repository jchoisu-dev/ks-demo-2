import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchBreakdown } from "../services";
import type { BreakdownItem } from "../dashboard.types";
export const useBreakdown = (params: { month: string; currency: string; item: BreakdownItem; page: number }) => {
  return useQuery({
    queryKey: ["dashboard-breakdown", params],
    queryFn: () => fetchBreakdown(params),
    enabled: Boolean(params.month && params.currency && params.item),
    placeholderData: keepPreviousData
  });
};
