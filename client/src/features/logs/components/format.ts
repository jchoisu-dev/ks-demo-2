import type { TFunction } from "i18next";
import type { LogEntry } from "../logs.types";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
export const humanize = (field: string) => field
  .split(".")
  .map(part => /^\d+$/.test(part) ? `#${Number(part) + 1}` : part.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " "))
  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" › ");
export const formatValue = (value: unknown, locale: string, t: TFunction): string => {
  if (value == null || value === "") return "—";
  if (typeof value == "boolean") return value ? t("common.yes") : t("common.no");
  if (typeof value == "number") return value.toLocaleString(locale, { maximumFractionDigits: 2 });
  if (typeof value == "string" && ISO_DATE.test(value)) {
    const isMidnight = value.includes("T00:00:00");
    return new Intl.DateTimeFormat(locale, isMidnight
      ? { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }
      : { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  }
  if (typeof value == "object") return JSON.stringify(value);
  return String(value);
};
export const formatDateTime = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
export const actionLabel = (entry: Pick<LogEntry, "entity" | "action">, t: TFunction) => entry.entity == "payslip" && entry.action != "DELETE"
  ? t(entry.action == "CREATE" ? "logs.actions.SIGN" : "logs.actions.RESIGN")
  : t(`logs.actions.${entry.action}`);
export const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-green-50 text-green-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-red-50 text-red-700"
};
