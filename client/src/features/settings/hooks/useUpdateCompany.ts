import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.updateCompany,

    onSuccess: (company) => {
      toast.success(i18n.t('company.updated'));
      queryClient.setQueryData(['company'], company);
    },

    onError: (error) => {
      // @ts-ignore
      toast.error(error?.response?.data?.message || i18n.t('company.updateFailed'));
    }
  });
};
