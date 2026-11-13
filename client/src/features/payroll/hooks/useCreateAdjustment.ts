import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import { useAppDispatch } from "@/app/store";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import { apiErrorMessage } from '@/shared/utils/apiError';
import type { NewAdjustment } from '../payroll.types';
import { setModalPending } from "@/app/store/slices/modal";
export const useCreateAdjustment = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(payload: NewAdjustment) => {
      return await service.createAdjustment(payload)
    },

    onMutate: () => {
      dispatch(setModalPending(true));
    },

    onSuccess: () => {
      for (const queryKey of [["adjustments"], ["payrolls"], ["dashboard"]]) {
        queryClient.invalidateQueries({ queryKey });
      }
      toast.success(i18n.t('payroll.adjustmentAdded'));
      dispatch(setModalPending(false));
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error));
      dispatch(setModalPending(false));
    },
    
  });
};