import { lazy } from "react";
export const modalRegistry: any = 
{
  CREATE_OR_EDIT_EMPLOYEE: lazy(() => import("@/features/employees/forms/createOrUpdate")),
  DELETE_EMPLOYEE: lazy(() => import("@/features/employees/forms/delete")),
  CREATE_ATTENDANCE_FORM: lazy(() => import("@/features/attendance/forms/addAttendance")),

  CREATE_OR_EDIT_SHIFT_FORM: lazy(() => import("@/features/settings/shifts/forms/createOrUpdate")),
  DELETE_SHIFT: lazy(() => import("@/features/settings/shifts/forms/delete")),
  DELETE_TAX_VERSION: lazy(() => import("@/features/settings/forms/deleteTax")),
  CREATE_OR_EDIT_HOLIDAY_FORM: lazy(() => import("@/features/holidays/forms/createOrUpdate")),
  DELETE_HOLIDAY: lazy(() => import("@/features/holidays/forms/delete")),

  USER_FORM: lazy(() => import("@/features/users/forms/userForm")),
  USER_RESET_PASSWORD: lazy(() => import("@/features/users/forms/resetPassword")),
  DELETE_USER: lazy(() => import("@/features/users/forms/deleteUser")),


  EMAIL_ALL_PAYSLIPS: lazy(() => import("@/features/payroll/components/EmailAll")),
  ABOUT_APP: lazy(() => import("@/features/account/components/AboutModal")),
  CHANGE_PASSWORD: lazy(() => import("@/features/account/components/ChangePasswordModal")),
  PAYROLL_BREAKDOWN: lazy(() => import("@/features/dashboard/components/BreakdownDetails")),
  LOG_CHANGES: lazy(() => import("@/features/logs/components/Changes")),

  EMPLOYEE_PAYROLL_PDF: lazy(() => import("@/features/payroll/components/Pdf")),
  PAYROLL_PAYOUT: lazy(() => import("@/features/payroll/components/Payout")),
  EMPLOYEE_PAYROLL_GIFT: lazy(() => import("@/features/payroll/components/Gift"))
};