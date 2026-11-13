import { useQuery } from "@tanstack/react-query";
import { fetchTaxVersions } from "../services";
export const useGetTaxVersions = () => {
  return useQuery({
    queryKey: ["taxVersions"],
    queryFn: fetchTaxVersions
  });
};
