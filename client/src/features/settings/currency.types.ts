export type CurrencyCode = "SRD" | "USD" | "EUR";
export type RatePair = "USD_SRD" | "SRD_USD" | "EUR_SRD" | "SRD_EUR" | "USD_EUR" | "EUR_USD";
export type ExchangeRates = {
  currencies: CurrencyCode[];
  rates: Record<RatePair, number | null>;
  configured: boolean;
  updatedAt: string | null;
}
export type ExchangeRatesPayload = { rates: Record<RatePair, number | null> };
