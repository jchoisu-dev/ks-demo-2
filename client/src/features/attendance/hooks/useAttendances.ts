import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchAttendences } from "../services";
export const useGetAttendances= (calendarWeek: string) => {
  return useQuery({
    queryKey: ["attendances", calendarWeek],
    queryFn: () => fetchAttendences(calendarWeek),
    placeholderData: keepPreviousData
  });
};