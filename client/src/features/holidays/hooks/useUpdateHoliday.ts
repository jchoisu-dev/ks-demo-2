import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import { useAppDispatch } from "@/app/store";
import { setModalPending, closeModal } from "@/app/store/slices/modal";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
export const useUpdateHoliday = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.updateHoliday,

    onMutate: () => {
      dispatch(setModalPending(true));
    },

    onSuccess: () => {
      toast.success(i18n.t('holiday.updated'));
      dispatch(closeModal());

      queryClient.invalidateQueries({
        queryKey: ['holidays']
      });

      queryClient.invalidateQueries({
        queryKey: ['holiday']
      });
    },
  });
};