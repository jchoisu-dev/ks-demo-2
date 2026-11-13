import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import service from "../services";
export const useGetWorkHours = () => {
  return useQuery({
    queryKey: ["workHours"],
    queryFn: service.fetchWorkHours
  });
};
export const useUpdateWorkHours = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.updateWorkHours,

    onSuccess: (workHours) => {
      queryClient.setQueryData(["workHours"], workHours);
      for (const queryKey of [["attendances"], ["payrolls"], ["dashboard"], ["leave"]]) {
        queryClient.invalidateQueries({ queryKey });
      }
      toast.success(i18n.t('workHours.saved'));
    },

    onError: (error) => {
      // @ts-ignore
      toast.error(error?.response?.data?.message || i18n.t('workHours.saveFailed'));
    }
  });
};
