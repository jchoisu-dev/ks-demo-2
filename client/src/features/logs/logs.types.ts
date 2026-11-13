export type LogAction = "CREATE" | "UPDATE" | "DELETE";
export type LogEntity = "employee" | "user" | "attendance" | "adjustment" | "holiday" | "shift" | "company" | "tax" | "payslip" | "period";
export type LogChange = {
  field: string;
  from: unknown;
  to: unknown;
}
export type LogEntry = {
  id: string;
  createdAt: string;
  action: LogAction;
  entity: LogEntity;
  documentId: string;
  label: string;
  user: string;
  changes: LogChange[];
}
export type LogFilters = {
  q: string;
  entity: LogEntity | "";
  action: LogAction | "";
}
export type GetLogsParams = LogFilters & {
  page: number;
}
export type LogsResponse = {
  data: LogEntry[];
  meta: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
