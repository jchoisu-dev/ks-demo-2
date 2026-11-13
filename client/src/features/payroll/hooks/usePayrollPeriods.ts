import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import { apiErrorMessage } from '@/shared/utils/apiError';
import service from "../services";
const AFFECTED_QUERIES = [["payroll-periods"], ["payrolls"], ["dashboard"], ["attendances"]];
export const useGetPeriods = () => {
  return useQuery({
    queryKey: ["payroll-periods"],
    queryFn: service.fetchPeriods
  });
};
const usePeriodMutation = <T,>(mutationFn: (payload: T) => Promise<unknown>, message: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,

    onSuccess: () => {
      for (const queryKey of AFFECTED_QUERIES) queryClient.invalidateQueries({ queryKey });
      toast.success(i18n.t(message));
    },

    onError: (error) => {
      toast.error(apiErrorMessage(error));
    }
  });
};
export const useClosePeriod = () => usePeriodMutation(service.closePeriod, 'payroll.periodClosed');
export const useReopenPeriod = () => usePeriodMutation(service.reopenPeriod, 'payroll.periodReopened');
