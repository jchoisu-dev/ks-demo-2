import { z } from "zod";
import { Time } from "@internationalized/date";
import i18n, { tr } from "@/app/i18n";
const optionalEmail = z.union([z.literal(""), z.email({ error: tr("validation.emailInvalid") })]);
const OpeningHourSchema = z.object({
  day: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  open: z.boolean(),
  begin: z.custom<Time | null>(),
  end: z.custom<Time | null>()
}).superRefine((hours, ctx) => {
  if (!hours.open) return;
  if (!hours.begin) ctx.addIssue({ code: "custom", path: ["begin"], message: i18n.t("validation.openingTimeRequired") });
  if (!hours.end) ctx.addIssue({ code: "custom", path: ["end"], message: i18n.t("validation.closingTimeRequired") });
  if (hours.begin && hours.end && hours.begin.compare(hours.end) >= 0) {
    ctx.addIssue({ code: "custom", path: ["end"], message: i18n.t("validation.closingAfterOpening") });
  }
});
export const CompanySchema = z.object({
  name: z.string().trim().min(1, { error: tr("validation.companyNameRequired") }),
  legalName: z.string(),
  registrationNumber: z.string(),
  taxNumber: z.string(),
  description: z.string(),
  email: optionalEmail,
  phone: z.string(),
  website: z.string(),
  logoUrl: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    district: z.string(),
    postalCode: z.string(),
    country: z.string()
  }),
  contacts: z.array(z.object({
    name: z.string().trim().min(1, { error: tr("validation.contactNameRequired") }),
    role: z.string(),
    phone: z.string(),
    email: optionalEmail
  })),
  openingHours: z.array(OpeningHourSchema),
  currency: z.enum(["SRD", "USD", "EUR"]),
  timezone: z.string().trim().min(1, { error: tr("validation.timezoneRequired") }),
  payslip: z.object({ showCompanyDetails: z.boolean() })
});
export type CompanySchemaType = z.infer<typeof CompanySchema>;
