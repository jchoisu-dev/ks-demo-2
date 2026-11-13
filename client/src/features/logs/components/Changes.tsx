import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/app/store";
import { getLocale } from "@/app/i18n";
import type { LogEntry } from "../logs.types";
import { ACTION_STYLES, actionLabel, formatDateTime, formatValue, humanize } from "./format";
const Changes = () => {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const { modalProps } = useAppSelector((state) => state.modal);
  const entry: LogEntry | undefined = modalProps?.entry;
  if (!entry) return null;
  const isUpdate = entry.action == "UPDATE";
  return <div className="flex flex-col gap-4">
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + ACTION_STYLES[entry.action]}>{actionLabel(entry, t)}</span>
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{t(`logs.entities.${entry.entity}`)}</span>
      <span className="font-medium text-gray-900">{entry.label || "—"}</span>
    </div>
    <p className="text-xs text-gray-500">{t("logs.byUser", { user: entry.user })} · {formatDateTime(entry.createdAt, locale)}</p>
    {entry.changes.length == 0
      ? <p className="text-sm text-gray-500">{t("logs.noChanges")}</p>
      : <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{t("logs.field")}</th>
              {isUpdate && <th className="px-3 py-2 text-left font-medium">{t("logs.before")}</th>}
              <th className="px-3 py-2 text-left font-medium">{isUpdate ? t("logs.after") : t("logs.value")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entry.changes.map(change => <tr key={change.field}>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{humanize(change.field)}</td>
              {isUpdate && <td className="px-3 py-2 text-gray-500 line-through decoration-gray-300 break-all">{formatValue(change.from, locale, t)}</td>}
              <td className="px-3 py-2 text-gray-900 break-all">{formatValue(change.to, locale, t)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>}
  </div>;
};
export default Changes;
