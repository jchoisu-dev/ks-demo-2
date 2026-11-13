import { Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetTaxPayrollOptions, useUpdateTaxPayrollOptions } from "../hooks";
const PayrollTaxToggle = () => {
  const { t } = useTranslation();
  const { data, isPending } = useGetTaxPayrollOptions();
  const { mutate, isPending: isSaving } = useUpdateTaxPayrollOptions();
  const enabled = Boolean(data?.applyTax);
  const disabled = isPending || isSaving;
  return <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm flex items-center gap-3">
    <span className="grid place-items-center size-9 shrink-0 rounded-xl bg-[#f6ebe1] text-[#a46023]">
      <Receipt size={18} />
    </span>
    <div className="flex-1 min-w-0">
      <p id="payroll-tax-label" className="text-sm font-medium text-gray-900">{t("tax.applyToPayroll")}</p>
      <p className="text-xs text-gray-500">{t(enabled ? "tax.applyOnHint" : "tax.applyOffHint")}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-labelledby="payroll-tax-label"
      disabled={disabled}
      onClick={() => mutate({ applyTax: !enabled })}
      className="flex items-center gap-2 cursor-pointer rounded-full disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a46023]"
    >
      <span className="hidden sm:inline text-xs font-medium text-gray-600">{t(enabled ? "tax.applyOn" : "tax.applyOff")}</span>
      <span className={"relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors " + (enabled ? "bg-[#a46023]" : "bg-gray-300")}>
        <span className={"absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform " + (enabled ? "translate-x-4" : "")} />
      </span>
    </button>
  </div>;
};
export default PayrollTaxToggle;
