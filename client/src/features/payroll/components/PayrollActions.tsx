import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Landmark, Mail, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DateValue } from "@internationalized/date";
import { Button } from "@/shared/components/ui";
import { openModal, useAppDispatch } from "@/app/store";
import { useBankFile, useDeliveryOptions } from "../hooks";
type PayrollActionsProps = {
  beginDay: DateValue | null;
  endDay: DateValue | null;
  isDisabled?: boolean;
}
const CURRENCIES = ["SRD", "USD", "EUR"] as const;
const PayrollActions = ({ beginDay, endDay, isDisabled }: PayrollActionsProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: delivery } = useDeliveryOptions();
  const { mutate: downloadBankFile, isPending } = useBankFile();
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key == "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const item = "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
  const run = (action: () => void) => {
    setOpen(false);
    action();
  };
  return <div ref={menuRef} className="relative shrink-0">
    <Button
      aria-label={t("payroll.moreActions")}
      aria-haspopup="menu"
      aria-expanded={open}
      className="bg-white text-black border min-w-0 px-3 sm:px-4"
      isDisabled={isDisabled || isPending}
      onPress={() => setOpen(!open)}
    >
      <MoreHorizontal size={16} />
      <span className="hidden sm:inline">{isPending ? t("common.loading") + "..." : t("payroll.moreActions")}</span>
    </Button>
    {open && <div role="menu" className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
      <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{t("payroll.bankFile")}</p>
      <button type="button" role="menuitem" className={item} onClick={() => run(() => downloadBankFile({ beginDay, endDay, format: "xlsx" }))}>
        <Landmark size={16} className="text-[#a46023]" /> {t("payroll.bankExcel")}
      </button>
      {CURRENCIES.map(currency => <button key={currency} type="button" role="menuitem" className={item} onClick={() => run(() => downloadBankFile({ beginDay, endDay, format: "csv", currency }))}>
        <FileText size={16} className="text-gray-500" /> {t("payroll.bankCsv", { currency })}
      </button>)}
      <div className="my-1 border-t border-gray-200" />
      <button
        type="button"
        role="menuitem"
        className={item}
        disabled={!delivery?.email}
        title={delivery?.email ? undefined : t("payroll.emailNotConfigured")}
        onClick={() => run(() => dispatch(openModal({
          title: t("payroll.emailAllTitle"),
          size: "md",
          modalComponent: "EMAIL_ALL_PAYSLIPS",
          modalProps: { beginDay, endDay },
          hideFooter: true
        })))}
      >
        <Mail size={16} className="text-[#a46023]" /> {t("payroll.emailAll")}
      </button>
      {!delivery?.email && <p className="px-3 pb-2 text-xs text-gray-500">{t("payroll.emailNotConfigured")}</p>}
    </div>}
  </div>;
};
export default PayrollActions;
