import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import i18n from "@/app/i18n";
import axios from "@/shared/api/axios";
import { apiErrorMessage } from "@/shared/utils/apiError";
import type { NewPayoutLine, Payout } from "../payroll.types";
type Period = { beginDay: string; endDay: string };
export const usePayout = (employeeId?: string, period?: Period) => useQuery({
  queryKey: ["payout", employeeId, period?.beginDay, period?.endDay],
  queryFn: async (): Promise<Payout> => (await axios.get(`/payroll/payouts/${employeeId}`, { params: period })).data,
  enabled: Boolean(employeeId && period?.beginDay && period?.endDay)
});
const useRefresh = () => {
  const queryClient = useQueryClient();
  return (payout: Payout) => {
    queryClient.setQueryData(["payout", payout.employee.id, payout.period.beginDay, payout.period.endDay], payout);
    queryClient.invalidateQueries({ queryKey: ["payrolls"] });
  };
};
export const useAddPayoutLine = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ employeeId, line }: { employeeId: string; line: NewPayoutLine }): Promise<Payout> => (await axios.post(`/payroll/payouts/${employeeId}`, line)).data,
    onSuccess: (payout) => {
      refresh(payout);
      toast.success(i18n.t("payroll.payout.saved"));
    },
    onError: (error) => toast.error(apiErrorMessage(error))
  });
};
export const useDeletePayoutLine = () => {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ employeeId, lineId, period }: { employeeId: string; lineId: string; period: Period }): Promise<Payout> =>
      (await axios.delete(`/payroll/payouts/${employeeId}/lines/${lineId}`, { params: period })).data,
    onSuccess: (payout) => {
      refresh(payout);
      toast.success(i18n.t("payroll.payout.deleted"));
    },
    onError: (error) => toast.error(apiErrorMessage(error))
  });
};
