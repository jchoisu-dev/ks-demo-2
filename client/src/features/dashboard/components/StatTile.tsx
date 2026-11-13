import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
}
const StatTile = ({ label, value, hint, icon: Icon }: StatTileProps) => {
  return <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm min-w-0">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-gray-500 line-clamp-2">{label}</p>
      {Icon && <span className="grid place-items-center size-8 sm:size-9 shrink-0 rounded-xl bg-[#f6ebe1] text-[#a46023]">
        <Icon size={17} />
      </span>}
    </div>
    <p className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900 truncate">{value}</p>
    {hint && <p className="mt-1 text-xs text-gray-500 line-clamp-2" title={hint}>{hint}</p>}
  </div>
}
export default StatTile;
