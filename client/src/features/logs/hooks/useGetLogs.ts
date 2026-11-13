import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchLogs } from "../services";
import type { GetLogsParams } from '../logs.types';
export const useGetLogs = (params: GetLogsParams) => {
  return useQuery({
    queryKey: ["logs", params],
    queryFn: () => fetchLogs(params),
    placeholderData: keepPreviousData
  });
};
