import axios from "@/shared/api/axios";
import type { EmployeeAdjustments, NewAdjustment, DeliveryOptions, EmailAllResult, BankFileOptions, PeriodDates, PayrollPeriods, PayrollPeriod, OverViewProps, ExportPayrollProps, EmployeePDFProps, PayslipPDF, SignPDFProps } from '../payroll.types';
import { formatDate } from '@/shared/utils';
const getOverview = async ({ beginDay, endDay }: OverViewProps): Promise<any> => {
  const { data } = await axios.get("/payroll", {
    params: {
      beginDay: await formatDate(beginDay),
      endDay: await formatDate(endDay)
    }
  });
  return data;
};
const exportPayroll = async ({ beginDay, endDay }: ExportPayrollProps): Promise<Blob> => {
  const { data } = await axios.get("/payroll/export", {
    params: {
      beginDay: await formatDate(beginDay),
      endDay: await formatDate(endDay)
    },
    responseType: "blob"
  });
  return data;
};
const toPayslipPDF = (response: any, employeeId: string, beginDay: string | null, endDay: string | null): PayslipPDF => {
  const blob = new Blob([response.data], { type: "application/pdf" });
  return {
    url: window.URL.createObjectURL(blob),
    employeeId,
    beginDay,
    endDay,
    signedAt: response.headers?.["x-signed-at"] || null
  };
};
const generatePDF = async ({ employeeId, beginDay, endDay }: EmployeePDFProps): Promise<PayslipPDF> => {
  const period = {
    beginDay: beginDay ? await formatDate(beginDay) : null,
    endDay: endDay ? await formatDate(endDay) : null
  };
  const response = await axios.post(`/payroll/pdf`, { employeeId, ...period }, { responseType: "blob" });
  return toPayslipPDF(response, employeeId!, period.beginDay, period.endDay);
};
const signPDF = async ({ employeeId, beginDay, endDay, signature }: SignPDFProps): Promise<PayslipPDF> => {
  const response = await axios.post(`/payroll/sign-pdf`, { employeeId, beginDay, endDay, signature }, { responseType: "blob" });
  return toPayslipPDF(response, employeeId, beginDay, endDay);
};

const getAdjustments = async ({ employeeId, month, page }: { employeeId: string; month: string; page: number }): Promise<EmployeeAdjustments> => {
  const { data } = await axios.get(`/adjustment/${employeeId}`, { params: { month, page } });
  return data;
};
const createAdjustment = async (payload: NewAdjustment) => {
  const { data } = await axios.post("/adjustment", payload);
  return data;
};
const deleteAdjustment = async (adjustmentId: string) => {
  const { data } = await axios.delete(`/adjustment/${adjustmentId}`);
  return data;
};
const getPeriods = async (): Promise<PayrollPeriods> => {
  const { data } = await axios.get("/payroll-periods");
  return data;
};
const closePeriod = async (period: { beginDay: string; endDay: string }): Promise<PayrollPeriod> => {
  const { data } = await axios.post("/payroll-periods", period);
  return data;
};
const reopenPeriod = async (id: string) => {
  const { data } = await axios.delete(`/payroll-periods/${id}`);
  return data;
};
const periodParams = async ({ beginDay, endDay }: PeriodDates) => ({
  beginDay: beginDay ? await formatDate(beginDay) : undefined,
  endDay: endDay ? await formatDate(endDay) : undefined
});
const getDeliveryOptions = async (): Promise<DeliveryOptions> => {
  const { data } = await axios.get("/payroll/delivery");
  return data;
};
const emailPayslip = async ({ employeeId, beginDay, endDay }: { employeeId: string; beginDay: string | null; endDay: string | null }) => {
  const { data } = await axios.post("/payroll/email", { employeeId, beginDay, endDay });
  return data;
};
const emailAllPayslips = async (period: PeriodDates): Promise<EmailAllResult> => {
  const { data } = await axios.post("/payroll/email-all", await periodParams(period));
  return data;
};
const getBankFile = async ({ format, currency, ...period }: BankFileOptions) => {
  const response = await axios.get("/payroll/bank-file", {
    params: { ...(await periodParams(period)), format, currency },
    responseType: "blob"
  });
  return {
    file: response.data as Blob,
    missing: Number(response.headers?.["x-missing-accounts"] || 0)
  };
};
export default {
  getOverview,
  getDeliveryOptions,
  emailPayslip,
  emailAllPayslips,
  getBankFile,
  getPeriods,
  closePeriod,
  reopenPeriod,
  exportPayroll,
  generatePDF,
  signPDF,
  getAdjustments,
  createAdjustment,
  deleteAdjustment
}