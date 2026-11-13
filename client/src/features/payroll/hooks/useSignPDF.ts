import { useMutation } from "@tanstack/react-query";
import service from "../services";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
const errorMessage = async (error: any) => {
  const data = error?.response?.data;
  try {
    if (data instanceof Blob) return JSON.parse(await data.text())?.message;
  } catch {  }
  return data?.message;
};
export const useSignPDF = () => {
  return useMutation({
    mutationFn: service.signPDF,

    onSuccess: () => {
      toast.success(i18n.t('payroll.signSaved'));
    },

    onError: async (error) => {
      toast.error((await errorMessage(error)) || i18n.t('payroll.signFailed'));
    }
  });
};
