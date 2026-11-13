import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import i18n from "@/app/i18n";
import { apiErrorMessage } from "@/shared/utils/apiError";
import axios from "@/shared/api/axios";
import type { ExchangeRates, ExchangeRatesPayload } from "../currency.types";
export const fetchExchangeRates = async (): Promise<ExchangeRates> => (await axios.get("/settings/currencies")).data;
export const useExchangeRates = () => useQuery({ queryKey: ["exchangeRates"], queryFn: fetchExchangeRates, staleTime: 60_000 });
export const useUpdateExchangeRates = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ExchangeRatesPayload): Promise<ExchangeRates> => (await axios.put("/settings/currencies", payload)).data,
    onSuccess: (rates) => {
      queryClient.setQueryData(["exchangeRates"], rates);
      toast.success(i18n.t("currencies.saved"));
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error));
    }
  });
};
