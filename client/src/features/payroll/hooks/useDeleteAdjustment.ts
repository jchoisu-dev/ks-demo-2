import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import { useAppDispatch, setModalPending } from "@/app/store";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import { apiErrorMessage } from '@/shared/utils/apiError';
export const useDeleteAdjustment = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async({ adjustmentId }: { adjustmentId: string}) => {
      return await service.deleteAdjustment({ adjustmentId })
    },

    onMutate: () => {
      dispatch(setModalPending(true));
    },

    onSuccess: () => {
      for (const queryKey of [["adjustments"], ["payrolls"], ["dashboard"]]) {
        queryClient.invalidateQueries({ queryKey });
      }
      toast.success(i18n.t('payroll.adjustmentDeleted'));
      dispatch(setModalPending(false));
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error));
      dispatch(setModalPending(false));
    },
    
  });
};