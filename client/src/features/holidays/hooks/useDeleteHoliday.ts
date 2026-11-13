import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import { useAppDispatch } from "@/app/store";
import { setModalPending, closeModal } from "@/app/store/slices/modal";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: service.deleteHoliday,

    onMutate: () => {
      dispatch(setModalPending(true));
    },

    onSuccess: () => {
      toast.success(i18n.t('holiday.deleted'));
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