export type LeaveBalance = {
  id: string;
  employee: string;
  yearly: number;
  custom: boolean;
  months: number;
  entitlement: number;
  taken: number;
  remaining: number;
  sick: number;
}
export type LeaveBalances = {
  enabled: boolean;
  year: number;
  defaultDays: number;
  data: LeaveBalance[];
  meta: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
export type GetLeaveParams = {
  page: number;
  year: number;
  q: string;
}
