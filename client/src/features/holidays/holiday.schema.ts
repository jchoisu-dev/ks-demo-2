import { z } from "zod";
import { tr } from "@/app/i18n";
import type { CalendarDate } from "@internationalized/date";
import { Time } from "@internationalized/date";
export const HolidaySchema = z.object({
  name: z
    .string()
    .min(1, { error: tr("validation.nameRequired") }),

  date: z.custom<CalendarDate | null>((value) => value != null, {
    error: tr("validation.dateRequired")
  }),

  type: z
    .enum(["national", "company", "religious", "optional"]),

  rate: z
    .number()
    .positive({ error: tr("validation.ratePositive") })
    .optional()
});
export type HolidaySchemaType = z.infer<typeof HolidaySchema>;