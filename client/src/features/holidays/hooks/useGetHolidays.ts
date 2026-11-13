import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchHolidays } from "../services";
import type { getHolidaysParams } from '../holidays.types';
export const useGetHolidays = ({ page, search }: getHolidaysParams) => {
  return useQuery({
    queryKey: ["holidays", page, search],
    queryFn: () => fetchHolidays({page, search}),
    placeholderData: keepPreviousData
  });
};