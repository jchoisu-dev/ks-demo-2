import { useEffect, useState } from "react";
import { ArrowLeftRight, Calculator, Info, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Spinner } from "@/shared/components/ui";
import { getLocale } from "@/app/i18n";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { useExchangeRates, useUpdateExchangeRates } from "../hooks";
import Section from "../components/Section";
import type { CurrencyCode, RatePair } from "../currency.types";
const PAIRS: [CurrencyCode, CurrencyCode][] = [["USD", "SRD"], ["EUR", "SRD"], ["USD", "EUR"]];
const ALL_PAIRS: RatePair[] = ["USD_SRD", "SRD_USD", "EUR_SRD", "SRD_EUR", "USD_EUR", "EUR_USD"];
const CURRENCIES: CurrencyCode[] = ["SRD", "USD", "EUR"];
const Currencies = () => {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const { isAdmin } = usePermissions();
  const { data, isPending, isError } = useExchangeRates();
  const { mutate, isPending: isSaving } = useUpdateExchangeRates();
  const [rates, setRates] = useState<Record<RatePair, string>>(() => Object.fromEntries(ALL_PAIRS.map(pair => [pair, ""])) as Record<RatePair, string>);
  const [example, setExample] = useState<{ amount: string; from: CurrencyCode; to: CurrencyCode }>({ amount: "100", from: "USD", to: "SRD" });
  useEffect(() => {
    if (data) setRates(Object.fromEntries(ALL_PAIRS.map(pair => [pair, data.rates[pair] == null ? "" : String(data.rates[pair])])) as Record<RatePair, string>);
  }, [data]);
  if (isPending) return <Spinner />;
  if (isError || !data) return <p className="text-sm text-gray-500">{t("common.somethingWentWrong")}</p>;
  const number = (value: number, digits = 6) => value.toLocaleString(locale, { maximumFractionDigits: digits });
  const money = (currency: string, value: number) => `${currency} ${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const valid = (value: string) => value.trim() === "" || (Number(value) > 0 && Number.isFinite(Number(value)));
  const invalid = ALL_PAIRS.filter(pair => !valid(rates[pair]));
  const dirty = ALL_PAIRS.some(pair => (data.rates[pair] == null ? "" : String(data.rates[pair])) != rates[pair]);
  const reverse = (from: CurrencyCode, to: CurrencyCode) => {
    const value = Number(rates[`${from}_${to}` as RatePair]);
    if (!(value > 0)) return;
    setRates({ ...rates, [`${to}_${from}`]: String(Math.round(1 / value * 1e6) / 1e6) });
  };
  const exampleRate = example.from == example.to ? 1 : Number(rates[`${example.from}_${example.to}` as RatePair]);
  const exampleAmount = Number(example.amount);
  const fieldClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm tabular-nums focus:outline-2 focus:outline-[#a46023] disabled:bg-gray-50";
  const rateInput = (from: CurrencyCode, to: CurrencyCode) => {
    const pair = `${from}_${to}` as RatePair;
    return <label className="block text-sm text-gray-700">
      <span className="flex items-center justify-between gap-2">
        <span>1 {from} =</span>
        {isAdmin && <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-[#a46023] hover:underline cursor-pointer disabled:opacity-40" disabled={!(Number(rates[`${to}_${from}` as RatePair]) > 0)} onClick={() => reverse(to, from)}>
          <RefreshCw size={12} /> {t("currencies.useReverse")}
        </button>}
      </span>
      <span className="mt-1 flex items-center gap-2">
        <input
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          disabled={!isAdmin}
          aria-label={t("currencies.rateLabel", { from, to })}
          className={fieldClass + (valid(rates[pair]) ? "" : " border-red-400")}
          value={rates[pair]}
          placeholder={t("currencies.notSet")}
          onChange={(e) => setRates({ ...rates, [pair]: e.target.value })}
        />
        <span className="w-10 shrink-0 text-sm font-medium text-gray-700">{to}</span>
      </span>
    </label>;
  };
  return <form
    className="flex flex-col gap-4 sm:gap-5"
    onSubmit={(e) => {
      e.preventDefault();
      if (invalid.length) return;
      mutate({ rates: Object.fromEntries(ALL_PAIRS.map(pair => [pair, rates[pair].trim() === "" ? null : Number(rates[pair])])) as Record<RatePair, number | null> });
    }}
  >
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-gray-500">
        {data.updatedAt
          ? t("currencies.updatedAt", { date: new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(data.updatedAt)) })
          : t("currencies.neverSet")}
      </p>
      {isAdmin && <Button type="submit" isPending={isSaving} isDisabled={!dirty || invalid.length > 0}>
        {isSaving ? t("common.loading") + "..." : t("common.save")}
      </Button>}
    </div>

    <Section title={t("currencies.title")} description={t("currencies.hint")} icon={ArrowLeftRight}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {PAIRS.map(([a, b]) => <div key={`${a}${b}`} className="rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
          <p className="font-semibold text-gray-900">{a} ↔ {b}</p>
          {rateInput(a, b)}
          {rateInput(b, a)}
        </div>)}
      </div>
      {invalid.length > 0 && <p className="text-xs text-red-600">{t("currencies.invalid")}</p>}
      <p className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
        <Info size={14} className="mt-0.5 shrink-0 text-[#a46023]" />
        {t("currencies.usageNote")}
      </p>
    </Section>

    <Section title={t("currencies.calculator")} description={t("currencies.calculatorHint")} icon={Calculator}>
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_8rem_auto_8rem] items-end gap-3">
        <label className="block text-sm text-gray-700">
          {t("currencies.amount")}
          <input type="number" min={0} step="any" inputMode="decimal" className={fieldClass + " mt-1"} value={example.amount} onChange={(e) => setExample({ ...example, amount: e.target.value })} />
        </label>
        <label className="block text-sm text-gray-700">
          {t("currencies.from")}
          <select className={fieldClass + " mt-1 cursor-pointer"} value={example.from} onChange={(e) => setExample({ ...example, from: e.target.value as CurrencyCode })}>
            {CURRENCIES.map(code => <option key={code} value={code}>{code}</option>)}
          </select>
        </label>
        <button type="button" aria-label={t("currencies.swap")} title={t("currencies.swap")} className="mb-1 grid size-9 place-items-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer" onClick={() => setExample({ ...example, from: example.to, to: example.from })}>
          <ArrowLeftRight size={16} />
        </button>
        <label className="block text-sm text-gray-700">
          {t("currencies.to")}
          <select className={fieldClass + " mt-1 cursor-pointer"} value={example.to} onChange={(e) => setExample({ ...example, to: e.target.value as CurrencyCode })}>
            {CURRENCIES.map(code => <option key={code} value={code}>{code}</option>)}
          </select>
        </label>
      </div>
      <p className="rounded-xl bg-[#f6ebe1] p-3 text-sm text-[#7a4719] tabular-nums">
        {exampleAmount > 0 && exampleRate > 0
          ? t("currencies.result", { amount: money(example.from, exampleAmount), rate: number(exampleRate), result: money(example.to, Math.round(exampleAmount * exampleRate * 100) / 100) })
          : t("currencies.noRate", { from: example.from, to: example.to })}
      </p>
    </Section>
  </form>;
};
export default Currencies;
