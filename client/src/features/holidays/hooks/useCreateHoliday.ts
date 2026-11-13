import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import { useAppDispatch } from "@/app/store";
import { setModalPending, closeModal } from "@/app/store/slices/modal";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
export const useCreateHoliday = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.createHoliday,

    onMutate: () => {
      dispatch(setModalPending(true));
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["holidays"]
      });
      toast.success(i18n.t('holiday.created'));
      dispatch(closeModal());
    },
    onError: (error) => {
      // @ts-ignore
      toast.error(error?.response?.data?.message);
      dispatch(setModalPending(false))
    }
  });
};