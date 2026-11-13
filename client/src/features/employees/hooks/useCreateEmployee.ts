import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import { useAppDispatch } from "@/app/store";
import { setModalPending, closeModal } from "@/app/store/slices/modal";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
export const useCreateEmployee = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.createEmployee,

    onMutate: () => {
      dispatch(setModalPending(true));
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees"]
      });
      toast.success(i18n.t('employee.created'));
      dispatch(closeModal());
    },
    onError: (error) => {
    }
  });
};