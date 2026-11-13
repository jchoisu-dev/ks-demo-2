import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import type { TaxVersions } from '../tax.types';
export const useSaveTaxVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.saveTaxVersion,

    onSuccess: (saved) => {
      toast.success(i18n.t('tax.saved'));
      queryClient.setQueryData<TaxVersions>(['taxVersions'], (old) => old && {
        ...old,
        versions: [saved, ...old.versions.filter(version => version.id != saved.id)]
          .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
      });
      queryClient.invalidateQueries({ queryKey: ['taxVersions'] });
    },

    onError: (error) => {
      // @ts-ignore
      toast.error(error?.response?.data?.message || i18n.t('tax.saveFailed'));
    }
  });
};
