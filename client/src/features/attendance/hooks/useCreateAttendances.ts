import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import { useAppDispatch } from "@/app/store";
import { setModalPending, closeModal } from "@/app/store/slices/modal";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import { apiErrorMessage } from '@/shared/utils/apiError';
export const useCreateAttendance = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.createAttendance,

    onMutate: () => {
      dispatch(setModalPending(true));
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendances"]
      });
      toast.success(i18n.t('attendance.added'));
      dispatch(closeModal());
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error));
      dispatch(setModalPending(false));
    }
  });
};