export type ShiftDay = "weekday" | "saturday" | "sunday";
export type OvertimeRateSource = "base" | "bonus";
export type OvertimeHoursBase = "weekday" | "day";
export interface StandardShift {
  working: boolean;
  begin: string;
  end: string;
  breakMinutes: number;
}
export interface WorkHours {
  weekday: number;
  saturday: number;
  sunday: number;
  shifts: Record<ShiftDay, StandardShift>;
  overtimeRates: {
    weekday: number;
    saturday: number;
    sunday: number;
  };
  saturdayDayValue: number;
  sundayDayValue: number;
  overtimeRateSource: OvertimeRateSource;
  overtimeHoursBase: OvertimeHoursBase;
  lockPeriods: boolean;
  leaveEnabled: boolean;
  leaveDaysPerYear: number;
  configured: boolean;
  updatedAt: string | null;
}
export type WorkHoursPayload = Pick<WorkHours, "shifts" | "overtimeRates" | "saturdayDayValue" | "sundayDayValue" | "overtimeRateSource" | "overtimeHoursBase" | "lockPeriods" | "leaveEnabled" | "leaveDaysPerYear">;
