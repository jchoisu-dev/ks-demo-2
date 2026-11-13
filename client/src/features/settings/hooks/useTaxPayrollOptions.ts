import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import service from "../services";
export const useGetTaxPayrollOptions = () => {
  return useQuery({
    queryKey: ["taxPayrollOptions"],
    queryFn: service.fetchTaxPayrollOptions
  });
};
export const useUpdateTaxPayrollOptions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.updateTaxPayrollOptions,

    onSuccess: (options) => {
      queryClient.setQueryData(["taxPayrollOptions"], options);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(i18n.t(options.applyTax ? 'tax.applyEnabled' : 'tax.applyDisabled'));
    },

    onError: (error) => {
      // @ts-ignore
      toast.error(error?.response?.data?.message || i18n.t('tax.applyFailed'));
    }
  });
};
