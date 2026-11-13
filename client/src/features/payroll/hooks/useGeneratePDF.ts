import { useMutation, useQueryClient } from "@tanstack/react-query";
import service from "../services";
import { useAppDispatch } from "@/app/store";
import toast from 'react-hot-toast';
import type { EmployeePDFProps } from '../payroll.types';
export const useGeneratePDF = ({beginDay, endDay}: EmployeePDFProps) => {
  return useMutation({
    mutationFn: async({ employeeId }: EmployeePDFProps) => {
      return await service.generatePDF({ employeeId, beginDay, endDay })
    },

    onMutate: () => {
    },

    onSuccess: () => {
    },
    onError: (error) => {
    },
    
  });
};