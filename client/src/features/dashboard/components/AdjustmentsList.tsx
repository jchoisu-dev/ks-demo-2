import { useState } from "react";
import { Pagination } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useDashboardAdjustments } from "../hooks";
import Avatar from "./Avatar";
type AdjustmentsListProps = {
  month: string;
  locale: string;
}
const money = (locale: string, currency: string, amount: number) =>
  `${currency} ${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const AdjustmentsList = ({ month, locale }: AdjustmentsListProps) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isPending, isPlaceholderData } = useDashboardAdjustments({ month, page });
  if (isPending) return <div className="h-24 animate-pulse rounded-xl bg-gray-50" aria-hidden="true" />;
  const items = data?.data || [];
  const meta = data?.meta;
  if (!meta || meta.totalRecords == 0) return <p className="text-sm text-gray-500">{t("dashboard.noAdjustments")}</p>;
  const day = (date: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));
  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.totalRecords);
  const pages = Array.from({ length: meta.totalPages }, (_, index) => index + 1).filter(p => Math.abs(p - meta.page) <= 2);
  const amountClass = (type: string) => type == "bonus" ? "text-[#067647]" : "text-[#b42318]";
  return <div className={"transition-opacity " + (isPlaceholderData ? "opacity-60" : "")}>
    <ul className="sm:hidden flex flex-col divide-y divide-gray-200">
      {items.map(item => (
        <li key={item.id} className="flex items-start gap-3 py-3">
          <Avatar name={item.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-gray-900 truncate">{item.name}</span>
              <span className={"shrink-0 font-semibold tabular-nums " + amountClass(item.type)}>
                {item.type == "bonus" ? "+" : "−"}{money(locale, item.currency, item.amount)}
                {item.originalCurrency && item.originalCurrency != item.currency && <span className="block text-[11px] font-normal text-gray-500">{money(locale, item.originalCurrency, item.originalAmount ?? 0)}</span>}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500 truncate">
              {item.scope == "month" ? t("payroll.adjustments.wholeMonth") : day(item.date)}{" · "}{t(`payroll.adjustmentTypes.${item.type}`)}{item.reason ? ` · ${item.reason}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>

    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full min-w-xl text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-gray-500">
            <th className="py-2 pr-3 text-left font-medium">{t("payroll.date")}</th>
            <th className="py-2 px-3 text-left font-medium">{t("payroll.employee")}</th>
            <th className="py-2 px-3 text-left font-medium">{t("payroll.type")}</th>
            <th className="py-2 px-3 text-left font-medium">{t("dashboard.reason")}</th>
            <th className="py-2 pl-3 text-right font-medium">{t("payroll.amount")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map(item => (
            <tr key={item.id}>
              <td className="py-2.5 pr-3 whitespace-nowrap text-gray-600 tabular-nums">{item.scope == "month" ? t("payroll.adjustments.wholeMonth") : day(item.date)}</td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2.5 whitespace-nowrap">
                  <Avatar name={item.name} />
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <span className={"rounded-full px-2.5 py-0.5 text-xs font-semibold " + (item.type == "bonus" ? "bg-[#ecfdf3] text-[#067647]" : "bg-[#fef3f2] text-[#b42318]")}>
                  {t(`payroll.adjustmentTypes.${item.type}`)}
                </span>
              </td>
              <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate" title={item.reason}>{item.reason || "—"}</td>
              <td className={"py-2.5 pl-3 text-right whitespace-nowrap font-semibold tabular-nums " + amountClass(item.type)}>
                {item.type == "bonus" ? "+" : "−"}{money(locale, item.currency, item.amount)}
                {item.originalCurrency && item.originalCurrency != item.currency && <span className="block text-[11px] font-normal text-gray-500">{money(locale, item.originalCurrency, item.originalAmount ?? 0)}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {meta.totalPages > 1 && <div className="mt-3 border-t border-gray-200 pt-3">
      <Pagination size="sm">
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
      </Pagination>
    </div>}
  </div>;
};
export default AdjustmentsList;
