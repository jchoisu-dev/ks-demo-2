import { z } from "zod";
import { tr } from "@/app/i18n";
import type { DateValue } from "@internationalized/date";
import { Time } from "@internationalized/date";
export const ShiftSchema = z.object({
  name: z
    .string()
    .min(1, { error: tr("validation.nameRequired") }),

  begin: z.custom<Time | null>((v) => v instanceof Time, {
    error: tr("validation.beginTimeRequired")
  }),

  end: z.custom<Time | null>((v) => v instanceof Time, {
    error: tr("validation.endTimeRequired")
  }),

  break: z
    .int()
    .optional(),

  type: z.enum(["work", "overtime"]),

  hiredAt: z.custom<DateValue | null>().optional(),

  description: z
    .string().optional()
});
export type ShiftSchemaType = z.infer<typeof ShiftSchema>;