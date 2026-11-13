import dayjs from "dayjs";
import { Alert } from "@heroui/react";
import { Users, UserPlus, ClipboardCheck, UserX, Clock, Timer, TrendingUp, TrendingDown, CalendarDays } from "lucide-react";
import { Spinner } from "@/shared/components/ui";
import { useAppSelector, useAppDispatch, openModal } from "@/app/store";
import { useGetDashboard } from "../hooks";
import type { AttendanceType, CurrencyTotals, Adjustments, BreakdownItem } from "../dashboard.types";
import StatTile from "../components/StatTile";
import Panel from "../components/Panel";
import BarList from "../components/BarList";
import MonthNav from "../components/MonthNav";
import Avatar from "../components/Avatar";
import AdjustmentsList from "../components/AdjustmentsList";
import DateChip from "../components/DateChip";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { getLocale, formatMonth } from "@/app/i18n";
const attendanceTypes: AttendanceType[] = ["present", "overtime", "absent", "leave", "sick", "holiday"];
const employeeTypes = ["full-time", "part-time"];
const payTypes = ["hourly", "daily", "weekly", "monthly"];
const CURRENCIES = ["SRD", "USD", "EUR"];
const emptyTotals = (currency: string): CurrencyTotals => ({
  currency,
  employees: 0,
  regularPay: 0,
  sundayPay: 0,
  overtimePay: 0,
  bonus: 0,
  deduction: 0,
  fullMonthBonus: 0,
  gross: 0,
  taxDeductions: 0,
  net: 0
});
const money = (locale: string, currency: string, amount: number) =>
  `${currency} ${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const amount = (locale: string, value: number) =>
  value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hours = (locale: string, value: number) => `${value.toLocaleString(locale, { maximumFractionDigits: 2 })}h`;
const toRows = (t: TFunction, counts: Record<string, number>, group: string, keys: string[]) =>
  keys.map(key => ({ id: key, label: t(`${group}.${key}`), value: counts[key] || 0 }));
const greetingKey = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
};
type HrDashboardProps = {
  month: string;
  setMonth: (month: string) => void;
}
const HrDashboard = ({ month, setMonth }: HrDashboardProps) => {
  const dispatch = useAppDispatch();
  const { data, isPending, isError, isPlaceholderData } = useGetDashboard(month);
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const firstName = useAppSelector((state) => state.auth.firstName);
  const greeting = firstName
    ? t(`dashboard.greeting${greetingKey()}Name`, { name: firstName })
    : t(`dashboard.greeting${greetingKey()}`);
  const header = <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{greeting}</h1>
      <p className="text-sm text-gray-500">
        {new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <MonthNav month={month} setMonth={setMonth} />
    </div>
  </div>;
  const page = (children: React.ReactNode) => <div className="flex flex-col gap-4 sm:gap-5">
    {header}
    {children}
  </div>;
  if (isPending) return page(<Spinner />);
  if (isError || !data) return page(<p className="text-sm text-gray-500">{t("dashboard.loadError")}</p>);
  const { hr, payroll } = data;
  const monthLabel = formatMonth(data.month, i18n.resolvedLanguage);
  const todayLabel = dayjs(hr.today.date).format("LL");
  const awayToday = hr.today.byType.absent + hr.today.byType.leave + hr.today.byType.sick;
  const byCurrency = CURRENCIES.map(currency => payroll.byCurrency?.find(totals => totals.currency == currency) ?? emptyTotals(currency));
  const adjustments: Adjustments = payroll.adjustments ?? {
    bonus: { count: 0, byCurrency: {} },
    deduction: { count: 0, byCurrency: {} },
    total: 0
  };
  const amountsLine = (amounts: Record<string, number>) =>
    CURRENCIES.filter(currency => amounts[currency]).map(currency => money(locale, currency, amounts[currency])).join(" · ") || "—";
  const amountCell = (currency: string, item: BreakdownItem, label: string, text: string, value: number) => value
    ? <button
      type="button"
      className="rounded-md px-1.5 py-1 tabular-nums cursor-pointer underline decoration-dotted decoration-gray-300 underline-offset-4 hover:bg-[#f6ebe1] hover:text-[#7a4719] hover:decoration-[#a46023] focus-visible:outline-2 focus-visible:outline-[#a46023]"
      title={t("dashboard.breakdownModal.hint")}
      onClick={() => dispatch(openModal({
        title: `${t(label)} · ${currency} · ${monthLabel}`,
        size: "lg",
        modalComponent: "PAYROLL_BREAKDOWN",
        modalProps: { month, currency, item },
        hideFooter: true
      }))}
    >
      {text}
    </button>
    : <span className="px-1.5 py-1 inline-block text-gray-500">{text}</span>;
  const todayRows = [
    ...toRows(t, hr.today.byType, "attendanceTypes", attendanceTypes),
    { id: "not-recorded", label: t("dashboard.notRecorded"), value: hr.today.notRecorded }
  ];
  return page(<div className={"flex flex-col gap-4 sm:gap-5 transition-opacity " + (isPlaceholderData ? "opacity-60" : "")}>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

      <div className="rounded-2xl bg-[#a46023] p-5 sm:p-6 text-white shadow-sm flex flex-col justify-between gap-6 min-w-0">
        <p className="text-sm text-white/80">{t("dashboard.estimatedNetPayroll")} · {monthLabel}</p>

        <ul className="flex flex-col divide-y divide-white/15">
          {byCurrency.map(totals => (
            <li key={totals.currency} className={"flex items-center gap-3 py-3 first:pt-0 " + (totals.employees ? "" : "opacity-60")}>
              <span className="grid place-items-center h-9 w-12 shrink-0 rounded-lg bg-white/15 text-xs font-semibold tracking-wide">
                {totals.currency}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium truncate">{t(`currencies.${totals.currency}`)}</span>
                <span className="block text-xs text-white/70">{t("dashboard.employeeCount", { count: totals.employees })}</span>
              </span>
              <span className="text-xl sm:text-2xl font-semibold tabular-nums tracking-tight whitespace-nowrap">
                {amount(locale, totals.net)}
              </span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-white/70">{t("dashboard.payrollEstimate", { begin: payroll.beginDay, end: payroll.endDay })}</p>
      </div>

      <div className="lg:col-span-2 grid grid-cols-2 gap-4 sm:gap-5">
        <StatTile
          icon={Users}
          label={t("dashboard.activeEmployees")}
          value={hr.employees.active}
          hint={t("dashboard.employeesSummary", { total: hr.employees.total, inactive: hr.employees.inactive, terminated: hr.employees.terminated })}
        />
        <StatTile
          icon={UserPlus}
          label={t("dashboard.newHires")}
          value={hr.employees.newHires}
          hint={t("dashboard.inMonth", { month: monthLabel })}
        />
        <StatTile
          icon={ClipboardCheck}
          label={t("dashboard.recordedToday")}
          value={`${hr.today.recorded} / ${hr.employees.active}`}
          hint={t("dashboard.notRecordedYet", { count: hr.today.notRecorded })}
        />
        <StatTile
          icon={UserX}
          label={t("dashboard.awayToday")}
          value={awayToday}
          hint={t("dashboard.awayHint")}
        />
      </div>
    </div>

    {payroll.notCalculated > 0 && <Alert status="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t("dashboard.notIncludedTitle")}</Alert.Title>
        <Alert.Description>
          {t("dashboard.notIncludedDescription", { count: payroll.notCalculated })}
        </Alert.Description>
      </Alert.Content>
    </Alert>}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
      <Panel title={t("dashboard.breakdownByCurrency")} subtitle={monthLabel} className="lg:col-span-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="col-span-2 sm:col-span-1 flex items-center gap-3 rounded-xl bg-gray-50 p-3" title={t(payroll.workdays.includesSaturday ? "dashboard.workdaysRuleMonSat" : "dashboard.workdaysRuleMonFri")}>
            <CalendarDays size={18} className="text-[#a46023] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{t("dashboard.workdays")}</p>
              <p className="font-semibold text-gray-900">
                {payroll.workdays.count}
                <span className="ml-1.5 text-xs font-normal text-gray-500">{t(payroll.workdays.includesSaturday ? "dashboard.workdaysMonSat" : "dashboard.workdaysMonFri")}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <Clock size={18} className="text-[#a46023] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{t("dashboard.regularHours")}</p>
              <p className="font-semibold text-gray-900">{hours(locale, payroll.hours.regular)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <Timer size={18} className="text-[#a46023] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{t("dashboard.overtimeHours")}</p>
              <p className="font-semibold text-gray-900">{hours(locale, payroll.hours.overtime)}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full min-w-md text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-3 text-left font-medium"></th>
                  {byCurrency.map(totals => (
                    <th key={totals.currency} className="py-2 pl-3 text-right font-medium">{totals.currency}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {([
                  ["regularPay", "dashboard.regularPay"],
                  ["sundayPay", "dashboard.sundayPay"],
                  ["overtimePay", "dashboard.overtimePay"],
                  ["bonus", "dashboard.bonuses"],
                  ...(byCurrency.some(totals => totals.fullMonthBonus > 0) ? [["fullMonthBonus", "dashboard.fullMonthBonus"]] as const : []),
                  ...(payroll.taxApplied ? [["taxDeductions", "dashboard.taxDeductions"]] as const : []),
                  ["deduction", "dashboard.deductions"]
                ] as const).map(([key, label]) => (
                  <tr key={key}>
                    <td className="py-2.5 pr-3 text-gray-600">{t(label)}</td>
                    {byCurrency.map(totals => (
                      <td key={totals.currency} className="py-1.5 pl-3 text-right tabular-nums text-gray-900">
                        {amountCell(totals.currency, key, label, ((key == "deduction" || key == "taxDeductions") && totals[key] > 0 ? "−" : "") + money(locale, totals.currency, totals[key] ?? 0), totals[key] ?? 0)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="pt-3 pr-3 text-gray-900">{t("dashboard.estimatedNet")}</td>
                  {byCurrency.map(totals => (
                    <td key={totals.currency} className="pt-2 pl-3 text-right tabular-nums text-gray-900">
                      {amountCell(totals.currency, "net", "dashboard.estimatedNet", money(locale, totals.currency, totals.net), totals.net)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
      </Panel>

      <Panel title={t("dashboard.todaysAttendance")} subtitle={todayLabel}>
        <BarList rows={todayRows} max={hr.employees.active} />
      </Panel>
    </div>


    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
      <Panel title={t("dashboard.adjustmentsTitle")} subtitle={monthLabel} className="lg:col-span-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {([
            ["bonus", TrendingUp, "text-[#067647] bg-[#ecfdf3]"],
            ["deduction", TrendingDown, "text-[#b42318] bg-[#fef3f2]"]
          ] as const).map(([type, Icon, tone]) => (
            <div key={type} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <span className={"grid place-items-center size-9 shrink-0 rounded-xl " + tone}>
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{t(`dashboard.${type}Count`, { count: adjustments[type].count })}</p>
                <p className="font-semibold text-gray-900 truncate">{amountsLine(adjustments[type].byCurrency)}</p>
              </div>
            </div>
          ))}
        </div>

        <AdjustmentsList key={month} month={month} locale={locale} />
      </Panel>

      <Panel title={t("dashboard.topOvertime")} subtitle={monthLabel}>
        <BarList
          rows={payroll.topOvertime.map(employee => ({
            id: employee.id,
            label: employee.name,
            value: employee.hours,
            display: hours(locale, employee.hours),
            leading: <Avatar name={employee.name} />
          }))}
          emptyText={t("dashboard.noOvertime")}
        />
      </Panel>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      <Panel title={t("dashboard.workforce")} subtitle={t("dashboard.activeEmployeesSubtitle")} className="md:col-span-2 lg:col-span-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">{t("dashboard.employmentType")}</p>
            <BarList rows={toRows(t, hr.employees.byType, "employeeTypes", employeeTypes)} max={hr.employees.active} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">{t("dashboard.payType")}</p>
            <BarList rows={toRows(t, payroll.byPayType, "payTypes", payTypes)} max={hr.employees.active} />
          </div>
        </div>
      </Panel>

      <Panel title={t("dashboard.upcomingHolidays")}>
        {hr.upcomingHolidays.length == 0
          ? <p className="text-sm text-gray-500">{t("dashboard.noUpcomingHolidays")}</p>
          : <ul className="flex flex-col gap-3">
            {hr.upcomingHolidays.map(holiday => (
              <li key={holiday.id} className="flex items-center gap-3">
                <DateChip date={holiday.date} locale={locale} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{holiday.name}</p>
                  <p className="text-xs text-gray-500">
                    {dayjs(holiday.date).format("dddd")} · {t(`holidayTypes.${holiday.type}`, { defaultValue: holiday.type })}
                  </p>
                </div>
              </li>
            ))}
          </ul>}
      </Panel>

      <Panel title={t("dashboard.birthdays")} subtitle={monthLabel}>
        {hr.birthdays.length == 0
          ? <p className="text-sm text-gray-500">{t("dashboard.noBirthdays")}</p>
          : <ul className="flex flex-col gap-3">
            {hr.birthdays.map(birthday => (
              <li key={birthday.id} className="flex items-center gap-3">
                <Avatar name={birthday.name} />
                <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 truncate">{birthday.name}</span>
                <span className="shrink-0 rounded-full bg-[#f6ebe1] px-2.5 py-1 text-xs font-medium text-[#7a4719]">
                  {new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(`2000-${birthday.date}T12:00:00`))}
                </span>
              </li>
            ))}
          </ul>}
      </Panel>
    </div>

  </div>)
}
export default HrDashboard;
