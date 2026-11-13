import { useState } from "react";
import dayjs from "dayjs";
import { Search, RotateCcw, Palmtree } from "lucide-react";
import { Link } from "react-router-dom";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { useTranslation } from "react-i18next";
import { Button, SearchField, Spinner } from "@/shared/components/ui";
import Table from "@/shared/components/table";
import { getLocale } from "@/app/i18n";
import { useGetLeaveBalances } from "../hooks";
import type { LeaveBalance } from "../leave.types";
const Leave = () => {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const currentYear = dayjs().year();
  const [page, setPage] = useState(1);
  const [year, setYear] = useState(currentYear);
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const { data, isPending } = useGetLeaveBalances({ page, year, q });
  const { isAdmin } = usePermissions();
  const days = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 1 });
  const columns = [
    { id: "id", name: "ID", hidden: true },
    { id: "employee", name: t("leave.employee") },
    { id: "entitlement", name: t("leave.entitlement") },
    { id: "taken", name: t("leave.taken") },
    { id: "remaining", name: t("leave.remaining") },
    { id: "sick", name: t("leave.sick") }
  ];
  const renderCell = (row: LeaveBalance, columnId: string) => {
    switch (columnId) {
      case "entitlement":
        return <span title={t("leave.entitlementHint", { yearly: days(row.yearly), months: row.months })}>
          {days(row.entitlement)}
          {(row.custom || row.months < 12) && <span className="ml-1.5 text-xs text-gray-500">
            ({[row.custom ? t("leave.custom") : "", row.months < 12 ? t("leave.monthsWorked", { count: row.months }) : ""].filter(Boolean).join(", ")})
          </span>}
        </span>;
      case "taken":
        return days(row.taken);
      case "remaining":
        return <span className={"rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums " + (row.remaining < 0 ? "bg-red-50 text-red-700" : row.remaining == 0 ? "bg-gray-100 text-gray-700" : "bg-green-50 text-green-700")}>
          {days(row.remaining)}
        </span>;
      case "sick":
        return days(row.sick);
      default:
        return undefined;
    }
  };
  if (isPending) return <Spinner />;
  if (data && !data.enabled) {
    return <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-14 text-center shadow-sm">
      <span className="grid place-items-center size-11 rounded-full bg-[#f6ebe1] text-[#a46023]"><Palmtree size={20} /></span>
      <p className="font-medium text-gray-900">{t("leave.disabledTitle")}</p>
      <p className="max-w-md text-sm text-gray-500">{t("leave.disabledDescription")}</p>
      {isAdmin && <Link to="/settings/work-hours" className="text-sm font-medium text-[#a46023] hover:underline">{t("leave.openPayrollRules")}</Link>}
    </div>;
  }
  const years = Array.from({ length: 5 }, (_, index) => currentYear + 1 - index);
  const runSearch = () => {
    setPage(1);
    setQ(query.trim());
  };
  return <div>
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <SearchField
        className="flex-1 min-w-0 md:flex-none md:w-72"
        inputClassName="w-full min-w-0"
        aria-label={t("leave.searchLabel")}
        placeholder={t("leave.searchPlaceholder")}
        value={query}
        onChange={(value: string) => setQuery(value)}
        onSubmit={runSearch}
      />
      <Button aria-label={t("common.search")} onPress={runSearch}>
        <Search className="sm:hidden" size={18} />
        <span className="hidden sm:inline">{t("common.search")}</span>
      </Button>
      <Button
        aria-label={t("common.reset")}
        className="bg-white text-black border"
        onPress={() => {
          setQuery("");
          setQ("");
          setPage(1);
          setYear(currentYear);
        }}
      >
        <RotateCcw className="sm:hidden" size={18} />
        <span className="hidden sm:inline">{t("common.reset")}</span>
      </Button>
      <div className="flex items-center gap-2 md:ml-auto">
        <span className="hidden sm:inline text-xs text-gray-500">{t("leave.defaultDays", { days: days(data?.defaultDays ?? 0) })}</span>
        <select
          aria-label={t("leave.year")}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer"
          value={year}
          onChange={(e) => {
            setPage(1);
            setYear(Number(e.target.value));
          }}
        >
          {years.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
    </div>

    <Table
      columns={columns}
      rows={data?.data || []}
      renderCell={renderCell}
      pagination={{
        page: data?.meta?.page || 1,
        limit: data?.meta?.limit || 10,
        totalRecords: data?.meta?.totalRecords || 0,
        totalPages: data?.meta?.totalPages || 0,
        hasNextPage: data?.meta?.hasNextPage || false,
        hasPreviousPage: data?.meta?.hasPreviousPage || false,
        onPageChange: setPage
      }}
    />
  </div>;
};
export default Leave;
