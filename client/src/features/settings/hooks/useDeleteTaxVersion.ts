import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import { useAppDispatch } from "@/app/store";
import { setModalPending, closeModal } from "@/app/store/slices/modal";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
export const useDeleteTaxVersion = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: service.deleteTaxVersion,

    onMutate: () => {
      dispatch(setModalPending(true));
    },

    onSuccess: () => {
      toast.success(i18n.t('tax.deleted'));
      dispatch(closeModal());
      queryClient.invalidateQueries({ queryKey: ['taxVersions'] });
    },

    onError: (error) => {
      dispatch(setModalPending(false));
      // @ts-ignore
      toast.error(error?.response?.data?.message || i18n.t('tax.saveFailed'));
    }
  });
};
