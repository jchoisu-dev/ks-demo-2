import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import { apiErrorMessage } from '@/shared/utils/apiError';
import service from "../services";
const AFFECTED_QUERIES = [["employee-attendance"], ["attendances"], ["leave"], ["payrolls"], ["dashboard"]];
export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.updateAttendance,

    onSuccess: () => {
      for (const queryKey of AFFECTED_QUERIES) queryClient.invalidateQueries({ queryKey });
      toast.success(i18n.t('attendance.updated'));
    },

    onError: (error) => {
      toast.error(apiErrorMessage(error));
    }
  });
};
