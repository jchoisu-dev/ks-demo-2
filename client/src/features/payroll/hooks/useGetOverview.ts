import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchOverview } from "../services";
import { OverViewProps } from '../payroll.types';
export const useGetOverview = ({page, beginDay, endDay}: OverViewProps) => 
{
  const hasDates = (!beginDay && !endDay) || (beginDay && endDay);
  return useQuery({
    queryKey: ["payrolls", page, beginDay, endDay],
    queryFn: () => fetchOverview({page, beginDay, endDay}),
    placeholderData: keepPreviousData,
    enabled: Boolean(hasDates)
  });
};