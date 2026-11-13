import { Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui";
import { closeModal, useAppDispatch, useAppSelector } from "@/app/store";
import { useEmailAllPayslips } from "../hooks";
const EmailAll = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { modalProps } = useAppSelector((state) => state.modal);
  const { mutate, data: result, isPending } = useEmailAllPayslips();
  const period = modalProps?.beginDay && modalProps?.endDay
    ? `${modalProps.beginDay.toString()} – ${modalProps.endDay.toString()}`
    : t("payroll.currentMonth");
  if (result) {
    return <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm font-medium text-green-700"><CheckCircle2 size={18} /> {t("payroll.emailAllSent", { count: result.sent, period: result.period })}</p>
      {result.skipped.length > 0 && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
        <p className="flex items-center gap-2 font-medium"><AlertTriangle size={16} /> {t("payroll.emailAllSkipped", { count: result.skipped.length })}</p>
        <p className="mt-1 text-xs">{result.skipped.map(item => item.name).join(", ")}</p>
      </div>}
      {result.failed.length > 0 && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
        <p className="font-medium">{t("payroll.emailAllFailed", { count: result.failed.length })}</p>
        <p className="mt-1 text-xs">{result.failed.map(item => `${item.name} (${item.to})`).join(", ")}</p>
      </div>}
      <div className="flex justify-end">
        <Button onPress={() => dispatch(closeModal())}>{t("payroll.done")}</Button>
      </div>
    </div>;
  }
  return <div className="flex flex-col gap-4">
    <p className="flex items-start gap-3 text-sm text-gray-700">
      <span className="grid place-items-center size-9 shrink-0 rounded-xl bg-[#f6ebe1] text-[#a46023]"><Mail size={18} /></span>
      {t("payroll.emailAllConfirm", { period })}
    </p>
    <div className="flex justify-end gap-2">
      <Button className="bg-white text-black border" onPress={() => dispatch(closeModal())} isDisabled={isPending}>{t("common.cancel")}</Button>
      <Button onPress={() => mutate({ beginDay: modalProps?.beginDay, endDay: modalProps?.endDay })} isPending={isPending}>
        {isPending ? t("payroll.sending") : t("payroll.emailAllButton")}
      </Button>
    </div>
  </div>;
};
export default EmailAll;
