import { useQuery } from '@tanstack/react-query';
import service from "../services";
export const useGetHoliday = (id: string) => {
  return useQuery({
    queryKey: ['holiday', id],
    queryFn: () => service.fetchOneHoliday(id),
    enabled: !!id
  });
};