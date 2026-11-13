import { useState } from "react";
import { Info, Lock } from "lucide-react";
import { Pagination } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/shared/components/ui";
import { useAppSelector } from "@/app/store";
import { getLocale } from "@/app/i18n";
import { useBreakdown } from "../hooks";
import type { BreakdownItem, BreakdownLine } from "../dashboard.types";
const DAY_TYPE_KEYS: Record<string, string> = { WORKDAY: "weekdays", SATURDAY: "saturday", SUNDAY: "sunday" };
const BreakdownDetails = () => {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const { modalProps } = useAppSelector((state) => state.modal);
  const item: BreakdownItem = modalProps?.item;
  const currency: string = modalProps?.currency;
  const [page, setPage] = useState(1);
  const { data, isPending, isError, isPlaceholderData } = useBreakdown({ month: modalProps?.month, currency, item, page });
  const money = (value: number) => `${currency} ${Number(value || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const number = (value: number) => Number(value || 0).toLocaleString(locale, { maximumFractionDigits: 2 });
  const date = (value: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  const k = (key: string, options?: Record<string, unknown>) => t(`dashboard.breakdownModal.${key}`, options);
  const calculation = (line: BreakdownLine): string[] => {
    const detail = line.detail || {};
    switch (item) {
      case "regularPay":
        if (detail.kind == "fixed") {
          const base = detail.payType == "monthly"
            ? k("fixedMonthly", { salary: money(detail.salary), days: detail.scheduledDays, total: detail.monthDays })
            : k("fixedWeekly", { days: detail.scheduledDays, rate: money(detail.dailyRate) });
          return detail.absenceDeduction > 0
            ? [base, k("absence", { count: detail.absentDays, rate: money(detail.dailyRate), amount: money(detail.absenceDeduction) })]
            : [base];
        }
        if (detail.kind == "hours") return [k("hours", { hours: number(detail.hours), rate: money(detail.rate) })];
        if (detail.saturdays > 0) {
          return [
            k("days", { count: detail.weekdays, rate: money(detail.rate) }) + (detail.incentive ? ` · ${k("incentiveRate")}` : ""),
            k("saturdays", { count: detail.saturdays, effective: number(detail.effectiveSaturdays), rate: money(detail.rate) })
          ];
        }
        return [k("days", { count: detail.days, rate: money(detail.rate) }) + (detail.incentive ? ` · ${k("incentiveRate")}` : "")];
      case "sundayPay":
        if (detail.sundays != null && detail.sundays != detail.days) {
          return [k("sundaysEffective", { count: detail.sundays, effective: number(detail.days), rate: money(detail.rate) })];
        }
        return [k("sundays", { count: detail.days, rate: money(detail.rate) })];
      case "overtimePay":
        return (detail.groups || []).map((group: any) => k("overtimeGroup", {
          hours: number(group.hours),
          rate: money(group.hourlyRate),
          multiplier: number(group.multiplier),
          day: t(`workHours.${DAY_TYPE_KEYS[group.dayType]}`)
        }));
      case "bonus":
      case "deduction":
        return (detail.items || []).map((entry: any) => `${date(entry.date)} · ${entry.reason || "—"} · ${money(entry.amount)}`);
      case "fullMonthBonus":
        return [k("fullMonth", { count: detail.workdays })];
      case "taxDeductions":
        return [
          ["wageTax", detail.wageTax], ["overtimeTax", detail.overtimeTax], ["aov", detail.aov], ["pension", detail.pension], ["health", detail.health]
        ].filter(([, value]) => value > 0).map(([key, value]) => `${k(`tax.${key}`)} ${money(value)}`);
      case "net":
        return [k("net", { gross: money(detail.gross), tax: money(detail.taxDeductions), deduction: money(detail.deduction) })];
      default:
        return [];
    }
  };
  if (isPending) return <Spinner size="sm" />;
  if (isError || !data) return <p className="text-sm text-gray-500">{t("common.somethingWentWrong")}</p>;
  const meta = data.meta;
  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.totalRecords);
  const pages = Array.from({ length: meta.totalPages }, (_, index) => index + 1).filter(p => Math.abs(p - meta.page) <= 2);
  return <div className={"flex flex-col gap-4 transition-opacity " + (isPlaceholderData ? "opacity-60" : "")}>
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
      <span>{data.period}</span>
      {data.closed && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"><Lock size={12} /> {k("closed")}</span>}
    </div>

    <p className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
      <Info size={16} className="mt-0.5 shrink-0 text-[#a46023]" />
      {k(`explain.${item}`, { workdays: data.workdays })}
    </p>

    {data.lines.length == 0
      ? <p className="py-6 text-center text-sm text-gray-500">{k("empty")}</p>
      : <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{k("employee")}</th>
              <th className="px-3 py-2 text-left font-medium">{k("calculation")}</th>
              <th className="px-3 py-2 text-right font-medium">{k("amount")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.lines.map(line => <tr key={line.employeeId} className="align-top">
              <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">{line.employee}</td>
              <td className="px-3 py-2.5 text-gray-600">
                {calculation(line).map((text, index) => <span key={index} className="block">{text}</span>)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-gray-900 whitespace-nowrap">{money(line.amount)}</td>
            </tr>)}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 font-semibold">
              <td className="px-3 py-2.5 text-gray-900" colSpan={2}>{k("total", { count: meta.totalRecords })}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-gray-900 whitespace-nowrap">{money(data.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>}

    {meta.totalPages > 1 && <Pagination size="sm">
      <Pagination.Summary>
        {t("common.paginationSummary", { start, end, total: meta.totalRecords })}
      </Pagination.Summary>
      <Pagination.Content className="flex-wrap">
        {meta.hasPreviousPage && <Pagination.Item>
          <Pagination.Previous onPress={() => setPage(Math.max(1, meta.page - 1))}>
            <Pagination.PreviousIcon />
            {t("common.prev")}
          </Pagination.Previous>
        </Pagination.Item>}
        {pages.map(p => (
          <Pagination.Item key={p}>
            <Pagination.Link isActive={p == meta.page} onPress={() => setPage(p)}>{p}</Pagination.Link>
          </Pagination.Item>
        ))}
        {meta.hasNextPage && <Pagination.Item>
          <Pagination.Next onPress={() => setPage(meta.page + 1)}>
            {t("common.next")}
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>}
      </Pagination.Content>
    </Pagination>}
  </div>;
};
export default BreakdownDetails;
