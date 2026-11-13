import { useMutation } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import service from "../services";
export const useExportPayroll = () => {
  return useMutation({
    mutationFn: service.exportPayroll,

    onSuccess: () => {
      toast.success(i18n.t('payroll.exportReady'));
    },

    onError: () => {
      toast.error(i18n.t('payroll.exportFailed'));
    }
  });
};
