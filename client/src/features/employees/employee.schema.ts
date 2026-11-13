import { z } from "zod";
import { tr } from "@/app/i18n";
import type { DateValue } from "@internationalized/date";
const SalarySchema = z.object({
  amount: z
    .number({ error: tr("validation.salaryRequired") })
    .positive({ error: tr("validation.salaryPositive") }),

  currency: z
    .enum(["USD", "EUR", "SRD"], { error: tr("validation.currencyRequired") }),

  payType: z
    .enum(["hourly", "daily", "weekly", "monthly"])
});
const Bonuschema = z.object({
  amount: z
    .number({ error: tr("validation.bonusRequired") })
    .nonnegative({ error: tr("validation.bonusNonNegative") }),
    

});
export const EmployeeSchema = z.object({
  firstName: z
    .string()
    .min(1, { error: tr("validation.firstNameRequired") }),

  lastName: z
    .string()
    .min(1, { error: tr("validation.lastNameRequired") }),

  middleName: z
    .string()
    .optional(),

  email: z
    .string().optional(),

  birthdate: z.custom<DateValue | null>().optional(),

  startWorkDay: z.custom<DateValue | null>().optional(),

  endWorkDay: z.custom<DateValue | null>().optional(),

  phone: z
    .string().optional(),

  address: z
    .string().optional(),

  position: z
    .string().optional(),

  salary: SalarySchema,

  incentive_weekdays: Bonuschema,

  type: z
    .enum(["full-time", "part-time"]),

  hiredAt: z.custom<DateValue | null>().optional(),

  description: z
    .string().optional(),

  profileImage: z
    .string().optional().nullable(),

  leaveDaysPerYear: z
    .number()
    .min(0, { error: tr("validation.nonNegative") })
    .max(366, { error: tr("validation.leaveDaysMax") })
    .nullable()
    .optional(),

  bank: z.object({
    name: z.string(),
    accountNumber: z.string(),
    accountHolder: z.string()
  })
});
export type EmployeeSchemaType = z.infer<typeof EmployeeSchema>;