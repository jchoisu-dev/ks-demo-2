export type TaxBracket = {
  upTo: number | null;
  rate: number;
}
export type HealthBand = {
  fromAge: number;
  toAge: number | null;
  monthly: number;
}
export type TaxVersion = {
  id: string | null;
  effectiveFrom: string;
  reference: string;
  notes: string;
  wageTax: {
    taxFreeAllowance: number;
    deductibleCostsRate: number;
    deductibleCostsMax: number;
    taxCredit: number;
    medicalAddition: number;
    brackets: TaxBracket[];
  };
  overtimeTax: { brackets: TaxBracket[] };
  specialPayments: { brackets: TaxBracket[] };
  exemptions: {
    holidayAllowance: number;
    bonus: number;
    childAllowancePerChild: number;
    childAllowanceMax: number;
  };
  aov: { rate: number; maxAge: number };
  pension: { rate: number; employerShare: number };
  healthInsurance: { employerShare: number; bands: HealthBand[] };
  updatedAt?: string | null;
}
export type TaxPayload = Omit<TaxVersion, "id" | "updatedAt">;
export type TaxVersions = {
  versions: TaxVersion[];
  defaults: TaxVersion;
}
export type TaxPreviewInput = {
  gross: number;
  overtime: number;
  age: number | null;
}
export type TaxPreview = {
  gross: number;
  overtime: number;
  deductibleCosts: number;
  netWage: number;
  taxFreeAllowance: number;
  taxableWage: number;
  wageTax: number;
  overtimeTax: number;
  aov: number;
  pensionEmployee: number;
  pensionEmployer: number;
  healthEmployee: number;
  healthEmployer: number;
  totalDeductions: number;
  netPay: number;
}
export interface TaxPayrollOptions {
  applyTax: boolean;
}
