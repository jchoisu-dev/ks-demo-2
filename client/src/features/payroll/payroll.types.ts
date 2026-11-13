import type { DateValue } from "@internationalized/date";
export type CalendarDaySelectProps = {
  setCalendarDay: (value: DateValue | null) => void;
  value: DateValue | null; 
  label: string;
}
export type OverViewProps = {
  page: number;
  beginDay?: DateValue | string  | null;
  endDay?: DateValue | string  | null;
  month?: string;
}
export type ExportPayrollProps = {
  beginDay?: DateValue | null;
  endDay?: DateValue | null;
}
export type EmployeePDFProps = {
  employeeId?: string;
  beginDay?: DateValue | string  | null;
  endDay?: DateValue | string  | null;
}

export type PayslipPDF = {
  url: string;
  employeeId: string;
  beginDay: string | null;
  endDay: string | null;
  signedAt: string | null;
}

export type SignPDFProps = {
  employeeId: string;
  beginDay: string | null;
  endDay: string | null;
  signature: string;
}

export type PayrollPeriod = {
  id: string;
  beginDay: string;
  endDay: string;
  closedAt: string;
  closedBy: string;
}
export type PayrollPeriods = {
  enabled: boolean;
  periods: PayrollPeriod[];
}
export type DeliveryOptions = {
  email: boolean;
}
export type PeriodDates = {
  beginDay?: DateValue | null;
  endDay?: DateValue | null;
}
export type EmailOutcome = {
  name: string;
  to?: string;
  reason?: string;
}
export type EmailAllResult = {
  period: string;
  sent: number;
  skipped: EmailOutcome[];
  failed: EmailOutcome[];
}
export type BankFileOptions = PeriodDates & {
  format: "xlsx" | "csv";
  currency?: "SRD" | "USD" | "EUR";
}
export type AdjustmentItem = {
  id: string;
  date: string;
  type: "bonus" | "deduction";
  amount: number;
  currency: string;
  originalAmount: number;
  exchangeRate: number;
  converted: boolean;
  scope: "date" | "month";
  reason: string;
}
export type EmployeeAdjustments = {
  month: string;
  employee: { id: string; name: string; currency: string };
  closed: { beginDay: string; endDay: string } | null;
  totals: { bonus: number; deduction: number; net: number };
  items: AdjustmentItem[];
  meta: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
export type NewAdjustment = {
  employeeId: string;
  type: "bonus" | "deduction";
  amount: number;
  currency?: string;
  scope?: "date" | "month";
  month?: string;
  date: string;
  reason: string;
}

export type PayoutStatus = "unpaid" | "partial" | "paid" | "overpaid";
export type PayoutLine = {
  id: string;
  date: string;
  payAmount: number;
  currency: string;
  amount: number;
  rate: number;
  method: "cash" | "bank" | "other";
  note: string;
}
export type Payout = {
  employee: { id: string; name: string };
  period: { beginDay: string; endDay: string };
  payCurrency: string;
  net: number;
  isCalculated: boolean;
  rates: Record<string, number | null>;
  lines: PayoutLine[];
  paid: number;
  outstanding: number;
  status: PayoutStatus;
}
export type PayoutRowStatus = { net: number; currency: string; paid: number; outstanding: number; status: PayoutStatus };
export type NewPayoutLine = {
  beginDay: string;
  endDay: string;
  payAmount: number;
  currency: string;
  method: PayoutLine["method"];
  date: string;
  note: string;
}
