export type Weekday = {
  key: string;
  label: string;
}

export type Attendances = {
  currentWeekState: {
    year: number;
    month: string;
    week: number;
  };
  employees: Employee[];
  weekdays: Weekday[];
  employeeTotalWorkedHours: Record<string, number>;
  employeetotalOvertimeMinutes: Record<string, number>;
}

export type Attendance = {
  name: string;
  date: string;
  begin: string;
  end: string;
  shift?: string;
  status: string;
  totalBreakMinutes?: number;
  totalWorkedMinutes: number;
}
type AttendanceStatus = {
  status: string | null;
};
export type Employee = {
  employeeId: string;
  name: string;
  attendances: Record<string, Attendance[]>;
  attendanceStatus: Record<string, AttendanceStatus>;
}
export type Shift = {
  id: string;
  name: string;
  shift: string;
  totalShiftMinutes: string;
  break: string;
  type: "work" | "overtime";
}
export type AttendanceType = "present" | "overtime" | "absent" | "leave" | "sick" | "holiday";
export type EmployeeAttendanceEntry = {
  id: string;
  name: string;
  date: string;
  begin: string;
  end: string;
  totalWorkedMinutes: string | number;
  totalBreakMinutes: number;
  type: AttendanceType;
  billable: boolean;
}
export type UpdateAttendancePayload = {
  id: string;
  type: AttendanceType;
  begin?: string;
  end?: string;
  totalBreakMinutes?: number;
  billable?: boolean;
}
