import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatMonth } from "@/app/i18n";
type MonthNavProps = {
  month: string;
  setMonth: (month: string) => void;
}
const MonthNav = ({ month, setMonth }: MonthNavProps) => {
  const { t, i18n } = useTranslation();
  const current = dayjs(`${month}-01`);
  const isCurrentMonth = month >= dayjs().format("YYYY-MM");
  const buttonClass = "grid place-items-center size-8 rounded-full cursor-pointer hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";
  return <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
    <button
      type="button"
      aria-label={t("dashboard.previousMonth")}
      className={buttonClass}
      onClick={() => setMonth(current.subtract(1, "month").format("YYYY-MM"))}
    >
      <ChevronLeft size={18} />
    </button>
    <span className="min-w-36 text-center text-sm font-medium">
      {formatMonth(month, i18n.resolvedLanguage)}
    </span>
    <button
      type="button"
      aria-label={t("dashboard.nextMonth")}
      className={buttonClass}
      disabled={isCurrentMonth}
      onClick={() => setMonth(current.add(1, "month").format("YYYY-MM"))}
    >
      <ChevronRight size={18} />
    </button>
  </div>
}
export default MonthNav;
