import { z } from "zod";
import type { CalendarDate } from "@internationalized/date";
import i18n, { tr } from "@/app/i18n";
const amount = z.number({ error: tr("validation.numberRequired") }).min(0, { error: tr("validation.nonNegative") });
const percent = amount.max(100, { error: tr("validation.percentMax") });
const Bracket = z.object({
  upTo: z.number({ error: tr("validation.numberRequired") }).positive({ error: tr("validation.positive") }).nullable(),
  rate: percent
});
const Brackets = z.array(Bracket).min(1, { error: tr("validation.bracketRequired") }).superRefine((brackets, ctx) => {
  brackets.forEach((bracket, index) => {
    const isLast = index == brackets.length - 1;
    const previous = brackets[index - 1]?.upTo;
    if (!isLast && bracket.upTo != null && previous != null && bracket.upTo <= previous) {
      ctx.addIssue({ code: "custom", path: [index, "upTo"], message: i18n.t("validation.bracketIncrease") });
    }
  });
});
const HealthBands = z.array(z.object({
  fromAge: amount,
  toAge: amount.nullable(),
  monthly: amount
})).superRefine((bands, ctx) => {
  bands.forEach((band, index) => {
    const isLast = index == bands.length - 1;
    if (!isLast && (band.toAge == null || band.toAge < band.fromAge)) {
      ctx.addIssue({ code: "custom", path: [index, "toAge"], message: i18n.t("validation.ageBandEnd") });
    }
  });
});
export const TaxSchema = z.object({
  effectiveFrom: z.custom<CalendarDate | null>((value) => value != null, { error: tr("validation.dateRequired") }),
  reference: z.string(),
  notes: z.string(),
  wageTax: z.object({
    taxFreeAllowance: amount,
    deductibleCostsRate: percent,
    deductibleCostsMax: amount,
    taxCredit: amount,
    medicalAddition: amount,
    brackets: Brackets
  }),
  overtimeTax: z.object({ brackets: Brackets }),
  specialPayments: z.object({ brackets: Brackets }),
  exemptions: z.object({
    holidayAllowance: amount,
    bonus: amount,
    childAllowancePerChild: amount,
    childAllowanceMax: amount
  }),
  aov: z.object({ rate: percent, maxAge: amount }),
  pension: z.object({ rate: percent, employerShare: percent }),
  healthInsurance: z.object({ employerShare: percent, bands: HealthBands })
});
export type TaxSchemaType = z.infer<typeof TaxSchema>;
