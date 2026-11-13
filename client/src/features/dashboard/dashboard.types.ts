export type AttendanceType = "present" | "overtime" | "absent" | "leave" | "sick" | "holiday";
export type CurrencyTotals = {
  currency: string;
  employees: number;
  regularPay: number;
  sundayPay: number;
  overtimePay: number;
  bonus: number;
  deduction: number;
  fullMonthBonus: number;
  gross: number;
  taxDeductions: number;
  net: number;
}
export type AdjustmentItem = {
  id: string;
  employeeId: string;
  name: string;
  type: "bonus" | "deduction";
  amount: number;
  currency: string;
  originalCurrency?: string;
  originalAmount?: number;
  scope?: "date" | "month";
  date: string;
  reason: string;
}
type AdjustmentGroup = {
  count: number;
  byCurrency: Record<string, number>;
}
export type Adjustments = {
  bonus: AdjustmentGroup;
  deduction: AdjustmentGroup;
  total: number;
}
export type Dashboard = {
  month: string;
  hr: {
    employees: {
      total: number;
      active: number;
      inactive: number;
      terminated: number;
      byType: Record<string, number>;
      newHires: number;
    };
    today: {
      date: string;
      recorded: number;
      notRecorded: number;
      byType: Record<AttendanceType, number>;
    };
    attendance: {
      byType: Record<AttendanceType, number>;
    };
    upcomingHolidays: { id: string; name: string; date: string; type: string }[];
    birthdays: { id: string; name: string; date: string }[];
  };
  payroll: {
    beginDay: string;
    endDay: string;
    employees: number;
    notCalculated: number;
    taxApplied?: boolean;
    byCurrency: CurrencyTotals[];
    workdays: {
      count: number;
      includesSaturday: boolean;
    };
    hours: {
      regular: number;
      overtime: number;
    };
    byPayType: Record<string, number>;
    topOvertime: { id: string; name: string; hours: number }[];
    adjustments?: Adjustments;
  };
}
export type BreakdownItem = "regularPay" | "sundayPay" | "overtimePay" | "bonus" | "fullMonthBonus" | "deduction" | "taxDeductions" | "net";
export type BreakdownLine = {
  employeeId: string;
  employee: string;
  payType: string;
  amount: number;
  detail: any;
}
export type Breakdown = {
  month: string;
  currency: string;
  item: BreakdownItem;
  period: string;
  closed: boolean;
  taxApplied: boolean;
  workdays: number;
  total: number;
  lines: BreakdownLine[];
  meta: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
export type AdjustmentsPage = {
  data: AdjustmentItem[];
  meta: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
