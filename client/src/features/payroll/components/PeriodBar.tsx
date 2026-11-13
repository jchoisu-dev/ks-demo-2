import { useState } from "react";
import dayjs from "dayjs";
import { Lock, LockOpen, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DateValue } from "@internationalized/date";
import { Button } from "@/shared/components/ui";
import { getLocale } from "@/app/i18n";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { useGetPeriods, useClosePeriod, useReopenPeriod } from "../hooks";
type PeriodBarProps = {
  beginDay: DateValue | null;
  endDay: DateValue | null;
}
const PeriodBar = ({ beginDay, endDay }: PeriodBarProps) => {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const { isAdmin, canEdit } = usePermissions();
  const { data } = useGetPeriods();
  const { mutate: close, isPending: isClosing } = useClosePeriod();
  const { mutate: reopen, isPending: isReopening } = useReopenPeriod();
  const [confirming, setConfirming] = useState<"close" | "reopen" | null>(null);
  if (!data?.enabled || Boolean(beginDay) != Boolean(endDay)) return null;
  const begin = beginDay ? beginDay.toString() : dayjs().startOf("month").format("YYYY-MM-DD");
  const end = endDay ? endDay.toString() : dayjs().endOf("month").format("YYYY-MM-DD");
  const date = (value: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  const dateTime = (value: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  const closed = data.periods.find(period => period.beginDay == begin && period.endDay == end);
  const overlap = !closed && data.periods.find(period => period.beginDay <= end && period.endDay >= begin);
  const range = `${date(begin)} – ${date(end)}`;
  const confirmButtons = (onConfirm: () => void, label: string, isPending: boolean) => <div className="flex shrink-0 gap-2">
    <Button className="bg-white text-black border" onPress={() => setConfirming(null)} isDisabled={isPending}>{t("common.cancel")}</Button>
    <Button onPress={onConfirm} isPending={isPending}>{label}</Button>
  </div>;
  if (closed) {
    return <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-green-100 bg-green-50/60 px-4 py-3">
      <span className="grid place-items-center size-9 shrink-0 rounded-full bg-green-100 text-green-700"><Lock size={16} /></span>
      <div className="flex-1 min-w-[14rem]">
        <p className="text-sm font-medium text-gray-900">{t("payroll.periodClosedTitle", { range })}</p>
        <p className="text-xs text-gray-600">{t("payroll.periodClosedBy", { date: dateTime(closed.closedAt), user: closed.closedBy || "—" })}</p>
      </div>
      {isAdmin && (confirming == "reopen"
        ? confirmButtons(() => reopen(closed.id, { onSuccess: () => setConfirming(null) }), t("payroll.confirmReopen"), isReopening)
        : <Button className="bg-white text-black border shrink-0" onPress={() => setConfirming("reopen")}><LockOpen size={16} /> {t("payroll.reopenPeriod")}</Button>)}
    </div>;
  }
  if (overlap) {
    return <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3">
      <span className="grid place-items-center size-9 shrink-0 rounded-full bg-amber-100 text-amber-700"><AlertTriangle size={16} /></span>
      <p className="text-sm text-gray-800">{t("payroll.periodOverlap", { range: `${date(overlap.beginDay)} – ${date(overlap.endDay)}` })}</p>
    </div>;
  }
  return <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
    <span className="grid place-items-center size-9 shrink-0 rounded-full bg-[#f6ebe1] text-[#a46023]"><LockOpen size={16} /></span>
    <div className="flex-1 min-w-[14rem]">
      <p className="text-sm font-medium text-gray-900">{t("payroll.periodOpenTitle", { range })}</p>
      <p className="text-xs text-gray-600">{confirming == "close" ? t("payroll.closeConfirmHint") : t("payroll.periodOpenHint")}</p>
    </div>
    {canEdit && (confirming == "close"
      ? confirmButtons(() => close({ beginDay: begin, endDay: end }, { onSuccess: () => setConfirming(null) }), t("payroll.confirmClose"), isClosing)
      : <Button className="shrink-0" onPress={() => setConfirming("close")}><Lock size={16} /> {t("payroll.closePeriod")}</Button>)}
  </div>;
};
export default PeriodBar;
