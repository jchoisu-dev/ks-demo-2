import { useMutation, useQuery } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import { apiErrorMessage } from '@/shared/utils/apiError';
import service from "../services";
export const useDeliveryOptions = () => {
  return useQuery({
    queryKey: ["payroll-delivery"],
    queryFn: service.fetchDeliveryOptions,
    staleTime: 5 * 60 * 1000
  });
};
export const useEmailPayslip = () => {
  return useMutation({
    mutationFn: service.emailPayslip,

    onSuccess: (result) => {
      toast.success(i18n.t('payroll.emailSent', { to: result?.to }));
    },

    onError: (error) => {
      toast.error(apiErrorMessage(error));
    }
  });
};
export const useEmailAllPayslips = () => {
  return useMutation({
    mutationFn: service.emailAllPayslips,

    onError: (error) => {
      toast.error(apiErrorMessage(error));
    }
  });
};
export const useBankFile = () => {
  return useMutation({
    mutationFn: service.downloadBankFile,

    onSuccess: ({ missing }) => {
      if (missing > 0) toast(i18n.t('payroll.bankMissing', { count: missing }), { icon: "⚠️" });
      else toast.success(i18n.t('payroll.bankReady'));
    },

    onError: (error) => {
      toast.error(apiErrorMessage(error));
    }
  });
};
