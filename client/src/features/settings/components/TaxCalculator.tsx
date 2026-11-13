import { useState } from "react";
import { Calculator } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTaxPreview } from "../hooks";
import type { TaxPayload } from "../tax.types";
const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm tabular-nums focus:outline-2 focus:outline-[#a46023]";
const TaxCalculator = ({ settings, locale }: { settings: TaxPayload; locale: string }) => {
  const { t } = useTranslation();
  const [gross, setGross] = useState("15000");
  const [overtime, setOvertime] = useState("0");
  const [age, setAge] = useState("30");
  const { data, isError, isFetching } = useTaxPreview(settings, {
    gross: Number(gross) || 0,
    overtime: Number(overtime) || 0,
    age: age === "" ? null : Number(age)
  });
  const srd = (value: number) => `SRD ${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const rows: [string, number | undefined, boolean?][] = data ? [
    [t("tax.calc.deductibleCosts"), data.deductibleCosts],
    [t("tax.calc.taxableWage"), data.taxableWage],
    [t("tax.calc.wageTax"), data.wageTax, true],
    [t("tax.calc.overtimeTax"), data.overtimeTax, true],
    [t("tax.calc.aov"), data.aov, true],
    [t("tax.calc.pension"), data.pensionEmployee, true],
    [t("tax.calc.health"), data.healthEmployee, true]
  ] : [];
  return <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
    <div className="flex items-start gap-3 mb-4">
      <span className="grid place-items-center size-9 shrink-0 rounded-xl bg-[#f6ebe1] text-[#a46023]">
        <Calculator size={18} />
      </span>
      <div>
        <h2 className="font-semibold text-gray-900">{t("tax.calc.title")}</h2>
        <p className="text-xs text-gray-500">{t("tax.calc.subtitle")}</p>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2 mb-4">
      <label className="text-xs text-gray-500">{t("tax.calc.gross")}
        <input className={inputClass + " mt-1"} inputMode="decimal" value={gross} onChange={e => setGross(e.target.value)} />
      </label>
      <label className="text-xs text-gray-500">{t("tax.calc.overtime")}
        <input className={inputClass + " mt-1"} inputMode="decimal" value={overtime} onChange={e => setOvertime(e.target.value)} />
      </label>
      <label className="text-xs text-gray-500">{t("tax.calc.age")}
        <input className={inputClass + " mt-1"} inputMode="numeric" value={age} onChange={e => setAge(e.target.value)} />
      </label>
    </div>

    {isError
      ? <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{t("tax.calc.fixErrors")}</p>
      : <div className={"transition-opacity " + (isFetching ? "opacity-60" : "")}>
        <dl className="flex flex-col divide-y divide-gray-200 text-sm">
          {rows.map(([label, value, isDeduction]) => (
            <div key={label} className="flex justify-between gap-3 py-2">
              <dt className="text-gray-600">{label}</dt>
              <dd className="tabular-nums text-gray-900">{value == null ? "—" : (isDeduction && value > 0 ? "−" : "") + srd(value)}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#a46023] px-4 py-3 text-white">
          <span className="text-sm text-white/85">{t("tax.calc.netPay")}</span>
          <span className="text-lg font-semibold tabular-nums">{data ? srd(data.netPay) : "—"}</span>
        </div>
        {data && (data.pensionEmployer > 0 || data.healthEmployer > 0) && <p className="mt-2 text-xs text-gray-500">
          {t("tax.calc.employerCost", { amount: srd(data.pensionEmployer + data.healthEmployer) })}
        </p>}
      </div>}
  </section>
}
export default TaxCalculator;
