import { useQuery } from '@tanstack/react-query';
import service from "../services";
export const useGetEmployee = (id: string) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => service.fetchOneEmployee(id),
    enabled: !!id
  });
};