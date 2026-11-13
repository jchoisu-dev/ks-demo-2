import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import { useAppDispatch } from "@/app/store";
import { setModalPending, closeModal } from "@/app/store/slices/modal";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
export const useUpdateShift = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.updateShift,

    onMutate: () => {
      dispatch(setModalPending(true));
    },

    onSuccess: () => {
      toast.success(i18n.t('shift.updated'));
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