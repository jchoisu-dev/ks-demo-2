import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GetUsersParams } from "../users.types";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import { useAppDispatch, closeModal, setModalPending } from "@/app/store";
import { apiErrorMessage } from '@/shared/utils/apiError';
import service from "../services";
export const useGetUsers = (params: GetUsersParams) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => service.fetchUsers(params),
    placeholderData: keepPreviousData
  });
};
const useUserMutation = <T,>(mutationFn: (payload: T) => Promise<unknown>, message: string, closeOnSuccess = true) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,

    onMutate: () => {
      if (closeOnSuccess) dispatch(setModalPending(true));
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(i18n.t(message));
      if (closeOnSuccess) dispatch(closeModal());
    },

    onError: (error) => {
      toast.error(apiErrorMessage(error));
      if (closeOnSuccess) dispatch(setModalPending(false));
    }
  });
};
export const useSaveUser = () => useUserMutation(service.saveUser, 'users.saved');
export const useResetPassword = () => useUserMutation(service.resetPassword, 'users.passwordReset');
export const useDeleteUser = () => useUserMutation(service.deleteUser, 'users.deleted');
export const useToggleUser = () => useUserMutation(service.saveUser, 'users.saved', false);
