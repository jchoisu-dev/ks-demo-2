import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import { useAppDispatch } from "@/app/store";
import { setModalPending, closeModal } from "@/app/store/slices/modal";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: service.deleteEmployee,

    onMutate: () => {
      dispatch(setModalPending(true));
    },

    onSuccess: () => {
      toast.success(i18n.t('employee.deleted'));
      dispatch(closeModal());
      queryClient.invalidateQueries({
        queryKey: ['employees']
      });

      queryClient.invalidateQueries({
        queryKey: ['employee']
      });
    },
  });
};