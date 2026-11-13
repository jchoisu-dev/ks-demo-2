import { z } from "zod";
import i18n, { tr } from "@/app/i18n";
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
export const shiftMinutes = ({ begin, end, breakMinutes }: { begin: string; end: string; breakMinutes: number }) => {
  if (!TIME.test(begin) || !TIME.test(end)) return 0;
  const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  let span = toMinutes(end) - toMinutes(begin);
  if (span <= 0) span += 1440;
  return Math.max(0, span - (Number(breakMinutes) || 0));
};
const Shift = z.object({
  working: z.boolean(),
  begin: z.string(),
  end: z.string(),
  breakMinutes: z.number({ error: tr("validation.numberRequired") }).min(0, { error: tr("validation.nonNegative") })
}).superRefine((shift, ctx) => {
  if (!shift.working) return;
  if (!TIME.test(shift.begin)) ctx.addIssue({ code: "custom", path: ["begin"], message: i18n.t("validation.timeRequired") });
  if (!TIME.test(shift.end)) ctx.addIssue({ code: "custom", path: ["end"], message: i18n.t("validation.timeRequired") });
  if (TIME.test(shift.begin) && TIME.test(shift.end) && shiftMinutes(shift) < 15) {
    ctx.addIssue({ code: "custom", path: ["end"], message: i18n.t("validation.shiftTooShort") });
  }
});
const rate = () => z.number({ error: tr("validation.numberRequired") })
  .min(1, { error: tr("validation.overtimeRateRange") })
  .max(5, { error: tr("validation.overtimeRateRange") });
const dayValue = () => z.number({ error: tr("validation.numberRequired") })
  .min(0, { error: tr("validation.dayValueRange") })
  .max(3, { error: tr("validation.dayValueRange") });
export const WorkHoursSchema = z.object({
  shifts: z.object({
    weekday: Shift,
    saturday: Shift,
    sunday: Shift
  }),
  overtimeRates: z.object({
    weekday: rate(),
    saturday: rate(),
    sunday: rate()
  }),
  saturdayDayValue: dayValue(),
  sundayDayValue: dayValue(),
  overtimeRateSource: z.enum(["base", "bonus"]),
  overtimeHoursBase: z.enum(["weekday", "day"]),
  lockPeriods: z.boolean(),
  leaveEnabled: z.boolean(),
  leaveDaysPerYear: z.number({ error: tr("validation.numberRequired") })
    .min(0, { error: tr("validation.nonNegative") })
    .max(366, { error: tr("validation.leaveDaysMax") })
});
export type WorkHoursSchemaType = z.infer<typeof WorkHoursSchema>;
