import { useQuery } from '@tanstack/react-query';
import service from "../services";
export const useGetShift = (id: string) => {
  return useQuery({
    queryKey: ['shift', id],
    queryFn: () => service.fetchOneShift(id),
    enabled: !!id
  });
};