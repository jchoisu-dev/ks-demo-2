import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import { useAppDispatch } from "@/app/store";
import { setModalPending, closeModal } from "@/app/store/slices/modal";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import { apiErrorMessage } from '@/shared/utils/apiError';
export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: service.deleteAttendance,

    onMutate: () => {
      dispatch(setModalPending(true));
    },

    onSuccess: () => {
      toast.success(i18n.t('attendance.deleted'));
      dispatch(closeModal());
      queryClient.invalidateQueries({
        queryKey: ['attendances']
      });

      queryClient.invalidateQueries({
        queryKey: ['employee-attendance']
      });
    },

    onError: (error) => {
      toast.error(apiErrorMessage(error));
      dispatch(setModalPending(false));
    }
  });
};