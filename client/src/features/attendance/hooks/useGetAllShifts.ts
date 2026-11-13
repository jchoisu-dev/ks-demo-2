import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchAllShifts } from "../services";
export const useGetAllShifts = () => {
  return useQuery({
    queryKey: ["radio-shifts"],
    queryFn: () => fetchAllShifts(),
    placeholderData: keepPreviousData
  });
};