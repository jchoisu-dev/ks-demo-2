import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
type BarListRow = {
  id: string;
  label: string;
  value: number;
  display?: string;
  leading?: ReactNode;
}
type BarListProps = {
  rows: BarListRow[];
  max?: number;
  emptyText?: string;
}
const BarList = ({ rows, max, emptyText }: BarListProps) => {
  const { t } = useTranslation();
  const scale = max ?? Math.max(...rows.map(row => row.value), 0);
  if (rows.length == 0) return <p className="text-sm text-gray-500">{emptyText ?? t("dashboard.noData")}</p>;
  return <ul className="flex flex-col gap-3">
    {rows.map(row => {
      const width = scale > 0 ? Math.min((row.value / scale) * 100, 100) : 0;
      const display = row.display ?? String(row.value);
      return <li key={row.id} title={`${row.label}: ${display}`} className="flex items-center gap-3">
        {row.leading}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-2 text-sm">
            <span className="text-gray-700 truncate">{row.label}</span>
            <span className="font-medium text-gray-900 tabular-nums">{display}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-gray-100">
            {width > 0 && <div
              className="h-1.5 rounded-full bg-[#a46023]"
              style={{ width: `${width}%` }}
            />}
          </div>
        </div>
      </li>
    })}
  </ul>
}
export default BarList;
