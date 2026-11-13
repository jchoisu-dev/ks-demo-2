import { useQuery } from "@tanstack/react-query";
import { fetchCompany } from "../services";
export const useGetCompany = (enabled = true) => {
  return useQuery({
    queryKey: ["company"],
    queryFn: fetchCompany,
    enabled,
    staleTime: 5 * 60 * 1000
  });
};
