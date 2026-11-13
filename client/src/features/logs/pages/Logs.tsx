import { useState } from "react";
import { Search, RotateCcw, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, SearchField, Spinner } from "@/shared/components/ui";
import Table from "@/shared/components/table";
import { getLocale } from "@/app/i18n";
import { openModal, useAppDispatch } from "@/app/store";
import { useGetLogs } from "../hooks";
import type { LogAction, LogEntity, LogEntry, LogFilters } from "../logs.types";
import { ACTION_STYLES, actionLabel, formatDateTime } from "../components/format";
const ENTITIES: LogEntity[] = ["employee", "user", "attendance", "adjustment", "holiday", "shift", "company", "tax", "payslip", "period"];
const ACTIONS: LogAction[] = ["CREATE", "UPDATE", "DELETE"];
const EMPTY_FILTERS: LogFilters = { q: "", entity: "", action: "" };
const Logs = () => {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<LogFilters>(EMPTY_FILTERS);
  const { data, isPending } = useGetLogs({ page, ...filters });
  const applyFilters = (next: Partial<LogFilters>) => {
    setPage(1);
    setFilters(current => ({ ...current, ...next }));
  };
  const columns = [
    { id: "id", name: "ID", hidden: true },
    { id: "createdAt", name: t("logs.date") },
    { id: "user", name: t("logs.user") },
    { id: "action", name: t("logs.action") },
    { id: "entity", name: t("logs.type") },
    { id: "label", name: t("logs.record") },
    { id: "changes", name: t("logs.details") }
  ];
  const renderCell = (entry: LogEntry, columnId: string) => {
    switch (columnId) {
      case "createdAt":
        return formatDateTime(entry.createdAt, locale);
      case "action":
        return <span className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + ACTION_STYLES[entry.action]}>{actionLabel(entry, t)}</span>;
      case "entity":
        return t(`logs.entities.${entry.entity}`);
      case "label":
        return <span className="block max-w-xs truncate" title={entry.label}>{entry.label || "—"}</span>;
      case "changes":
        return entry.changes.length > 0
          ? <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
            onClick={() => dispatch(openModal({
              title: t("logs.changesTitle"),
              size: "lg",
              modalComponent: "LOG_CHANGES",
              modalProps: { entry },
              hideFooter: true
            }))}
          >
            <Eye size={14} /> {t("logs.changes", { count: entry.changes.length })}
          </button>
          : "—";
      default:
        return undefined;
    }
  };
  if (isPending) return <Spinner />;
  const selectClass = "rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer min-w-0";
  return <div>
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <SearchField
        className="flex-1 min-w-0 md:flex-none md:w-72"
        inputClassName="w-full min-w-0"
        aria-label={t("logs.searchLabel")}
        placeholder={t("logs.searchPlaceholder")}
        value={query}
        onChange={(value: string) => setQuery(value)}
        onSubmit={() => applyFilters({ q: query.trim() })}
      />
      <Button aria-label={t("common.search")} onPress={() => applyFilters({ q: query.trim() })}>
        <Search className="sm:hidden" size={18} />
        <span className="hidden sm:inline">{t("common.search")}</span>
      </Button>
      <Button
        aria-label={t("common.reset")}
        className="bg-white text-black border"
        onPress={() => {
          setQuery("");
          setPage(1);
          setFilters(EMPTY_FILTERS);
        }}
      >
        <RotateCcw className="sm:hidden" size={18} />
        <span className="hidden sm:inline">{t("common.reset")}</span>
      </Button>
      <div className="flex w-full md:w-auto md:ml-auto gap-2">
        <select
          aria-label={t("logs.type")}
          className={selectClass + " flex-1 md:flex-none md:w-44"}
          value={filters.entity}
          onChange={(e) => applyFilters({ entity: e.target.value as LogFilters["entity"] })}
        >
          <option value="">{t("logs.allTypes")}</option>
          {ENTITIES.map(entity => <option key={entity} value={entity}>{t(`logs.entities.${entity}`)}</option>)}
        </select>
        <select
          aria-label={t("logs.action")}
          className={selectClass + " flex-1 md:flex-none md:w-40"}
          value={filters.action}
          onChange={(e) => applyFilters({ action: e.target.value as LogFilters["action"] })}
        >
          <option value="">{t("logs.allActions")}</option>
          {ACTIONS.map(action => <option key={action} value={action}>{t(`logs.actions.${action}`)}</option>)}
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
export default Logs;
