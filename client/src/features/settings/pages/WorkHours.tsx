import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Timer, Calculator, Info, Lock, Palmtree, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Button, Spinner } from "@/shared/components/ui";
import { getLocale } from "@/app/i18n";
import { useGetWorkHours, useUpdateWorkHours } from "../hooks";
import { WorkHoursSchema, shiftMinutes, type WorkHoursSchemaType } from "../workHours.schema";
import type { WorkHours as WorkHoursSettings } from "../workHours.types";
import Section from "../components/Section";
import NumberInput from "../components/NumberInput";
type DayKey = "weekday" | "saturday" | "sunday";
const DAY_KEYS: DayKey[] = ["weekday", "saturday", "sunday"];
const EXAMPLE_RATE = 200;
const EXAMPLE_BONUS = 250;
const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
};
const WorkHours = () => {
  const { data, isPending } = useGetWorkHours();
  if (isPending || !data) return <Spinner />;
  return <WorkHoursForm key={data.updatedAt ?? "new"} settings={data} />;
};
const WorkHoursForm = ({ settings }: { settings: WorkHoursSettings }) => {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const { mutate, isPending: isSaving } = useUpdateWorkHours();
  const { control, handleSubmit, formState: { isDirty, errors } } = useForm<WorkHoursSchemaType>({
    resolver: zodResolver(WorkHoursSchema),
    mode: "onSubmit",
    defaultValues: {
      shifts: {
        weekday: { ...settings.shifts.weekday, working: true },
        saturday: { ...settings.shifts.saturday },
        sunday: { ...settings.shifts.sunday }
      },
      overtimeRates: { ...settings.overtimeRates },
      saturdayDayValue: settings.saturdayDayValue,
      sundayDayValue: settings.sundayDayValue,
      overtimeRateSource: settings.overtimeRateSource,
      overtimeHoursBase: settings.overtimeHoursBase,
      lockPeriods: settings.lockPeriods,
      leaveEnabled: settings.leaveEnabled,
      leaveDaysPerYear: settings.leaveDaysPerYear
    }
  });
  const values = useWatch({ control }) as WorkHoursSchemaType;
  const [example, setExample] = useState<{ day: DayKey; begin: string; end: string; breakMinutes: number }>({
    day: "weekday",
    begin: "08:00",
    end: "19:00",
    breakMinutes: 60
  });
  const number = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 2 });
  const hoursLabel = (value: number) => t("workHours.hoursValue", { value: number(value) });
  const begin = toMinutes(example.begin);
  const end = toMinutes(example.end);
  let workedMinutes = begin != null && end != null ? end - begin - (example.breakMinutes || 0) : 0;
  if (begin != null && end != null && end < begin) workedMinutes += 1440;
  workedMinutes = Math.max(0, workedMinutes);
  const exampleShift = values.shifts?.[example.day];
  const standardMinutes = exampleShift?.working ? shiftMinutes(exampleShift) : 0;
  const regularMinutes = Math.min(workedMinutes, standardMinutes);
  const overtimeMinutes = Math.max(0, workedMinutes - standardMinutes);
  const multiplier = Number(values.overtimeRates?.[example.day]) || 1;
  const weekdayHours = values.shifts?.weekday ? shiftMinutes(values.shifts.weekday) / 60 : 8;
  const dayHours = (day: DayKey) => {
    const shift = values.shifts?.[day];
    return shift?.working || day == "weekday" ? (shift ? shiftMinutes(shift) / 60 : 0) : 0;
  };
  const overtimeDivisor = (day: DayKey) => values.overtimeHoursBase == "day" && dayHours(day) > 0 ? dayHours(day) : weekdayHours;
  const overtimeDayRate = values.overtimeRateSource == "bonus" ? EXAMPLE_BONUS : EXAMPLE_RATE;
  const fieldClass = "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-[#a46023]";
  return <form
    id="WORK_HOURS_FORM"
    onSubmit={handleSubmit((form) => mutate(form))}
    noValidate
    className="flex flex-col gap-4 sm:gap-5"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{t("workHours.title")}</h1>
        <p className="text-sm text-gray-500">{t("workHours.subtitle")}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden sm:inline text-sm text-gray-500">
          {isDirty || !settings.configured ? t("tax.unsavedChanges") : settings.updatedAt ? t("company.lastUpdated", { date: dayjs(settings.updatedAt).format("LLL") }) : ""}
        </span>
        <Button type="submit" isPending={isSaving}>
          {isSaving ? t("common.loading") + "..." : t("common.save")}
        </Button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">

      <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-5 min-w-0">

        <Section title={t("workHours.standardHours")} description={t("workHours.standardHoursHint")} icon={CalendarDays}>
          <div className="hidden sm:grid grid-cols-[minmax(9rem,1fr)_6rem_7rem_7rem_6rem_4rem] items-center gap-3 px-1 text-xs font-medium text-gray-500">
            <span>{t("workHours.day")}</span>
            <span>{t("workHours.workingDay")}</span>
            <span>{t("workHours.begin")}</span>
            <span>{t("workHours.end")}</span>
            <span>{t("workHours.breakMinutes")}</span>
            <span className="text-right">{t("workHours.hoursShort")}</span>
          </div>
          <ul className="flex flex-col gap-2">
            {DAY_KEYS.map(day => {
              const shift = values.shifts?.[day];
              const working = day == "weekday" || Boolean(shift?.working);
              const minutes = working && shift ? shiftMinutes(shift) : 0;
              const shiftErrors = errors.shifts?.[day];
              const timeClass = "w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-2 focus:outline-[#a46023] disabled:bg-gray-50 disabled:text-gray-400";
              return <li key={day} className={"grid grid-cols-2 sm:grid-cols-[minmax(9rem,1fr)_6rem_7rem_7rem_6rem_4rem] items-center gap-3 rounded-xl px-1 py-2 " + (working ? "" : "opacity-70")}>
                <span className="col-span-2 sm:col-span-1 flex items-baseline justify-between gap-2 font-medium text-gray-900">
                  {t(`workHours.${day == "weekday" ? "weekdays" : day}`)}
                  <span className="sm:hidden text-sm font-semibold tabular-nums">{working ? hoursLabel(minutes / 60) : <span className="text-xs font-normal text-gray-500">{t("workHours.dayOff")}</span>}</span>
                </span>
                {day == "weekday"
                  ? <span className="text-xs text-gray-500">{t("workHours.alwaysWorking")}</span>
                  : <Controller
                    name={`shifts.${day}.working`}
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(field.value)}
                        aria-label={t("workHours.workingDayFor", { day: t(`workHours.${day}`) })}
                        onClick={() => field.onChange(!field.value)}
                        className="justify-self-start flex items-center gap-2 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a46023]"
                      >
                        <span className={"relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors " + (field.value ? "bg-[#a46023]" : "bg-gray-300")}>
                          <span className={"absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform " + (field.value ? "translate-x-4" : "")} />
                        </span>
                        <span className="sm:hidden text-xs text-gray-600">{t(field.value ? "tax.applyOn" : "tax.applyOff")}</span>
                      </button>
                    )}
                  />}
                <Controller
                  name={`shifts.${day}.begin`}
                  control={control}
                  render={({ field }) => <label className="text-xs text-gray-500">
                    <span className="sm:hidden">{t("workHours.begin")}</span>
                    <input type="time" aria-label={`${t(`workHours.${day == "weekday" ? "weekdays" : day}`)} ${t("workHours.begin")}`} className={timeClass + (shiftErrors?.begin ? " border-red-400" : "")} disabled={!working} value={field.value || ""} onChange={(e) => field.onChange(e.target.value)} />
                  </label>}
                />
                <Controller
                  name={`shifts.${day}.end`}
                  control={control}
                  render={({ field }) => <label className="text-xs text-gray-500">
                    <span className="sm:hidden">{t("workHours.end")}</span>
                    <input type="time" aria-label={`${t(`workHours.${day == "weekday" ? "weekdays" : day}`)} ${t("workHours.end")}`} className={timeClass + (shiftErrors?.end ? " border-red-400" : "")} disabled={!working} value={field.value || ""} onChange={(e) => field.onChange(e.target.value)} />
                  </label>}
                />
                <Controller
                  name={`shifts.${day}.breakMinutes`}
                  control={control}
                  render={({ field }) => <label className="text-xs text-gray-500">
                    <span className="sm:hidden">{t("workHours.breakMinutes")}</span>
                    <input type="number" min={0} step={5} aria-label={`${t(`workHours.${day == "weekday" ? "weekdays" : day}`)} ${t("workHours.breakMinutes")}`} className={timeClass} disabled={!working} value={field.value ?? 0} onChange={(e) => field.onChange(Math.max(0, Number(e.target.value) || 0))} />
                  </label>}
                />
                <span className="hidden sm:block text-right text-sm font-semibold tabular-nums text-gray-900">
                  {working ? hoursLabel(minutes / 60) : <span className="text-xs font-normal text-gray-500">{t("workHours.dayOff")}</span>}
                </span>
                {(shiftErrors?.end?.message || shiftErrors?.begin?.message) && <span className="col-span-2 sm:col-span-6 text-xs text-red-600">{shiftErrors?.end?.message || shiftErrors?.begin?.message}</span>}
              </li>;
            })}
          </ul>
          <p className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
            <Info size={14} className="mt-0.5 shrink-0 text-[#a46023]" />
            {t("workHours.shiftPayNote")}
          </p>
        </Section>

        <Section title={t("workHours.payRules")} description={t("workHours.payRulesHint")} icon={SlidersHorizontal}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput control={control} name="saturdayDayValue" label={t("workHours.saturdayDayValue")} description={t("workHours.saturdayDayValueHint")} isRequired />
            <NumberInput control={control} name="sundayDayValue" label={t("workHours.sundayDayValue")} description={t("workHours.sundayDayValueHint")} isRequired />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="overtimeRateSource"
              control={control}
              render={({ field }) => <label className="block text-sm text-gray-700">
                {t("workHours.overtimeRateSource")}
                <select className={fieldClass + " cursor-pointer"} value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                  <option value="base">{t("workHours.overtimeRateSourceBase")}</option>
                  <option value="bonus">{t("workHours.overtimeRateSourceBonus")}</option>
                </select>
                <span className="mt-1 block text-xs text-gray-500">{t("workHours.overtimeRateSourceHint")}</span>
              </label>}
            />
            <Controller
              name="overtimeHoursBase"
              control={control}
              render={({ field }) => <label className="block text-sm text-gray-700">
                {t("workHours.overtimeHoursBase")}
                <select className={fieldClass + " cursor-pointer"} value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                  <option value="weekday">{t("workHours.overtimeHoursBaseWeekday", { hours: number(weekdayHours) })}</option>
                  <option value="day">{t("workHours.overtimeHoursBaseDay")}</option>
                </select>
                <span className="mt-1 block text-xs text-gray-500">{t("workHours.overtimeHoursBaseHint")}</span>
              </label>}
            />
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
            <p className="mb-1.5 flex items-center gap-2 font-medium text-gray-700"><Info size={14} className="shrink-0 text-[#a46023]" />{t("workHours.rulesExample", { rate: number(EXAMPLE_RATE), bonus: number(EXAMPLE_BONUS) })}</p>
            <ul className="flex flex-col gap-0.5 pl-6 tabular-nums">
              <li>{t("workHours.rulesExampleSaturday", { days: number(5 * (Number(values.saturdayDayValue) || 0)), value: number(Number(values.saturdayDayValue) || 0) })}</li>
              <li>{t("workHours.rulesExampleSunday", { days: number(4 * (Number(values.sundayDayValue) || 0)), value: number(Number(values.sundayDayValue) || 0) })}</li>
              {(["weekday", "saturday", "sunday"] as const).map(day => <li key={day}>
                {t("workHours.rulesExampleOvertime", {
                  day: t(`workHours.${day == "weekday" ? "weekdays" : day}`),
                  rate: number(overtimeDayRate),
                  hours: number(overtimeDivisor(day)),
                  multiplier: number(Number(values.overtimeRates?.[day]) || 1),
                  amount: number(overtimeDivisor(day) > 0 ? overtimeDayRate / overtimeDivisor(day) * (Number(values.overtimeRates?.[day]) || 1) : 0)
                })}
              </li>)}
            </ul>
          </div>
        </Section>

        <Section title={t("workHours.overtime")} description={t("workHours.overtimeHint")} icon={Timer}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <NumberInput control={control} name="overtimeRates.weekday" label={t("workHours.overtimeRateWeekdays")} description={t("workHours.overtimeRateHint")} isRequired />
            <NumberInput control={control} name="overtimeRates.saturday" label={t("workHours.overtimeRateSaturday")} isRequired />
            <NumberInput control={control} name="overtimeRates.sunday" label={t("workHours.overtimeRateSunday")} isRequired />
          </div>
          <p className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
            <Info size={14} className="mt-0.5 shrink-0 text-[#a46023]" />
            {t("workHours.hourlyRateNote")}
          </p>
        </Section>

        <Section title={t("workHours.leaveTitle")} description={t("workHours.leaveHint")} icon={Palmtree}>
          <Controller
            name="leaveEnabled"
            control={control}
            render={({ field }) => (
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p id="leave-enabled-label" className="text-sm font-medium text-gray-900">{t("workHours.leaveEnabledLabel")}</p>
                  <p className="text-xs text-gray-500">{t(field.value ? "workHours.leaveOnHint" : "workHours.leaveOffHint")}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(field.value)}
                  aria-labelledby="leave-enabled-label"
                  onClick={() => field.onChange(!field.value)}
                  className="flex items-center gap-2 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a46023]"
                >
                  <span className="hidden sm:inline text-xs font-medium text-gray-600">{t(field.value ? "tax.applyOn" : "tax.applyOff")}</span>
                  <span className={"relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors " + (field.value ? "bg-[#a46023]" : "bg-gray-300")}>
                    <span className={"absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform " + (field.value ? "translate-x-4" : "")} />
                  </span>
                </button>
              </div>
            )}
          />
          {values.leaveEnabled && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <NumberInput control={control} name="leaveDaysPerYear" label={t("workHours.leaveDays")} description={t("workHours.leaveDaysHint")} isRequired />
          </div>}
        </Section>

        <Section title={t("workHours.lockTitle")} description={t("workHours.lockHint")} icon={Lock}>
          <Controller
            name="lockPeriods"
            control={control}
            render={({ field }) => (
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p id="lock-periods-label" className="text-sm font-medium text-gray-900">{t("workHours.lockLabel")}</p>
                  <p className="text-xs text-gray-500">{t(field.value ? "workHours.lockOnHint" : "workHours.lockOffHint")}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(field.value)}
                  aria-labelledby="lock-periods-label"
                  onClick={() => field.onChange(!field.value)}
                  className="flex items-center gap-2 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a46023]"
                >
                  <span className="hidden sm:inline text-xs font-medium text-gray-600">{t(field.value ? "tax.applyOn" : "tax.applyOff")}</span>
                  <span className={"relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors " + (field.value ? "bg-[#a46023]" : "bg-gray-300")}>
                    <span className={"absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform " + (field.value ? "translate-x-4" : "")} />
                  </span>
                </button>
              </div>
            )}
          />
        </Section>

      </div>

      <Section title={t("workHours.example")} description={t("workHours.exampleHint")} icon={Calculator}>
        <label className="block text-sm text-gray-700">
          {t("workHours.dayType")}
          <select
            className={fieldClass + " cursor-pointer"}
            value={example.day}
            onChange={(e) => setExample({ ...example, day: e.target.value as DayKey })}
          >
            {DAY_KEYS.map(day => <option key={day} value={day}>{t(`workHours.${day == "weekday" ? "weekdays" : day}`)}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="block text-sm text-gray-700 min-w-0">
            {t("workHours.begin")}
            <input type="time" className={fieldClass} value={example.begin} onChange={(e) => setExample({ ...example, begin: e.target.value })} />
          </label>
          <label className="block text-sm text-gray-700 min-w-0">
            {t("workHours.end")}
            <input type="time" className={fieldClass} value={example.end} onChange={(e) => setExample({ ...example, end: e.target.value })} />
          </label>
          <label className="block text-sm text-gray-700 min-w-0">
            {t("workHours.breakMinutes")}
            <input type="number" min={0} step={5} className={fieldClass} value={example.breakMinutes} onChange={(e) => setExample({ ...example, breakMinutes: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
        </div>
        <dl className="divide-y divide-gray-200 text-sm">
          <div className="flex justify-between py-2">
            <dt className="text-gray-600">{t("workHours.worked")}</dt>
            <dd className="font-medium text-gray-900 tabular-nums">{hoursLabel(workedMinutes / 60)}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-gray-600">{t("workHours.regular")}</dt>
            <dd className="font-medium text-gray-900 tabular-nums">{hoursLabel(regularMinutes / 60)}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-gray-600">{t("workHours.overtimeHours", { rate: number(multiplier) })}</dt>
            <dd className={"font-semibold tabular-nums " + (overtimeMinutes > 0 ? "text-[#b54708]" : "text-gray-500")}>{hoursLabel(overtimeMinutes / 60)}</dd>
          </div>
        </dl>
        <p className="rounded-xl bg-[#f6ebe1] p-3 text-xs text-[#7a4719]">
          {standardMinutes == 0
            ? t("workHours.exampleNoStandard")
            : t("workHours.exampleSummary", { standard: number(standardMinutes / 60), overtime: number(overtimeMinutes / 60), rate: number(multiplier) })}
        </p>
      </Section>

    </div>
  </form>;
};
export default WorkHours;
