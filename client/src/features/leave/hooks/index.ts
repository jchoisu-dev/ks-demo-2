import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchBalances } from "../services";
import type { GetLeaveParams } from "../leave.types";
export const useGetLeaveBalances = (params: GetLeaveParams) => {
  return useQuery({
    queryKey: ["leave", params],
    queryFn: () => fetchBalances(params),
    placeholderData: keepPreviousData
  });
};
