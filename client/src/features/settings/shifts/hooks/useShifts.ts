import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchShifts } from "../services";
import type { getShiftsParams } from '../shifts.types';
export const useGetShifts = ({ page, search }: getShiftsParams) => {
  return useQuery({
    queryKey: ["shifts", page, search],
    queryFn: () => fetchShifts({page, search}),
    placeholderData: keepPreviousData
  });
};