import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { previewTax } from "../services";
import type { TaxPayload, TaxPreviewInput } from "../tax.types";
export const useTaxPreview = (settings: TaxPayload | null, input: TaxPreviewInput) => {
  const [debounced, setDebounced] = useState({ settings, input });
  const key = JSON.stringify({ settings, input });
  useEffect(() => {
    const timer = setTimeout(() => setDebounced({ settings, input }), 300);
    return () => clearTimeout(timer);
  }, [key]);
  return useQuery({
    queryKey: ["taxPreview", JSON.stringify(debounced)],
    queryFn: () => previewTax({ settings: debounced.settings!, input: debounced.input }),
    enabled: Boolean(debounced.settings),
    placeholderData: keepPreviousData,
    retry: false
  });
};
