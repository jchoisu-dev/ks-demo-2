import { z } from "zod";
import { tr } from "@/app/i18n";
import { Time } from "@internationalized/date";

export const AttendanceStandardSchema = z.object({
  shiftId: z
    .string()
    .min(1, { error: tr('validation.shiftRequired') })
});
export type AttendanceStandardSchemaType = z.infer<typeof AttendanceStandardSchema>;

export const AttendanceManualSchema = z.object({
  begin: z.custom<Time | null>(
    (value) => value !== null, { error: tr("validation.beginTimeRequired") }
  ),

  end: z.custom<Time | null>(
    (value) => value !== null, { error: tr("validation.endTimeRequired") }
  ),

  totalBreakMinutes: z
    .number()
    .positive({ error: tr("validation.breakPositive") })
    .optional(),

  type: z
    .enum(["present", "overtime", "absent", "leave", "sick"])

});
export type AttendanceManualSchemaType = z.infer<typeof AttendanceManualSchema>;

export const AttendanceOtherSchema = z.object({
  type: z
    .enum(["present", "overtime", "absent", "leave", "sick"]),
  billable: z
    .enum(["Yes", "No"]),
});
export type AttendanceOtherSchemaType = z.infer<typeof AttendanceOtherSchema>;