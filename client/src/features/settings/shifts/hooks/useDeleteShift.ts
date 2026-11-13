import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import { useAppDispatch } from "@/app/store";
import { setModalPending, closeModal } from "@/app/store/slices/modal";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: service.deleteShift,

    onMutate: () => {
      dispatch(setModalPending(true));
    },

    onSuccess: () => {
      toast.success(i18n.t('shift.deleted'));
      dispatch(closeModal());
      queryClient.invalidateQueries({
        queryKey: ['shifts']
      });

      queryClient.invalidateQueries({
        queryKey: ['shift']
      });
    },
  });
};