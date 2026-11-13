import dayjs from "dayjs";
import api from "../api";
import type { NewAdjustment, PeriodDates, BankFileOptions, OverViewProps, ExportPayrollProps, EmployeePDFProps, SignPDFProps } from '../payroll.types';
export const fetchOverview = async ({ page, beginDay, endDay }: OverViewProps) => {
  try {
    const overviews = await api.getOverview({ page, beginDay, endDay });
    return overviews;
  } catch (error) {
  }
};
export const exportPayroll = async ({ beginDay, endDay }: ExportPayrollProps) => {
  const file = await api.exportPayroll({ beginDay, endDay });
  const period = beginDay && endDay
    ? `${beginDay.toString()}_${endDay.toString()}`
    : dayjs().format("YYYY-MM");
  const url = window.URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `payroll_${period}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
export const generatePDF = async({ employeeId, beginDay, endDay }: EmployeePDFProps) => {
  try {
    if(!employeeId) return;
    const employeePDF = await api.generatePDF({ employeeId, beginDay, endDay });
    return employeePDF;
  } catch (error) {
  }
};
export const signPDF = async (payload: SignPDFProps) => {
  const employeePDF = await api.signPDF(payload);
  return employeePDF;
};
export const getAdjustments = async ({ employeeId, month, page }: { employeeId: string; month: string; page: number }) => {
  const adjustments = await api.getAdjustments({ employeeId, month, page });
  return adjustments;
};
export const createAdjustment = async (payload: NewAdjustment) => {
  const adjustments = await api.createAdjustment(payload);
  return adjustments;
};
export const deleteAdjustment = async ({adjustmentId} : { adjustmentId: string}) => {
  const adjustments = await api.deleteAdjustment(adjustmentId);
  return adjustments;
};
export const fetchPeriods = async () => {
  const periods = await api.getPeriods();
  return periods;
};
export const closePeriod = async (period: { beginDay: string; endDay: string }) => {
  const closed = await api.closePeriod(period);
  return closed;
};
export const reopenPeriod = async (id: string) => {
  const result = await api.reopenPeriod(id);
  return result;
};
export const fetchDeliveryOptions = async () => {
  const options = await api.getDeliveryOptions();
  return options;
};
export const emailPayslip = async (payload: { employeeId: string; beginDay: string | null; endDay: string | null }) => {
  const result = await api.emailPayslip(payload);
  return result;
};
export const emailAllPayslips = async (period: PeriodDates) => {
  const result = await api.emailAllPayslips(period);
  return result;
};
export const downloadBankFile = async (options: BankFileOptions) => {
  const { file, missing } = await api.getBankFile(options);
  const begin = options.beginDay ? options.beginDay.toString() : dayjs().startOf("month").format("YYYY-MM-DD");
  const end = options.endDay ? options.endDay.toString() : dayjs().endOf("month").format("YYYY-MM-DD");
  const url = window.URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bank_payments_${begin}_${end}${options.currency ? "_" + options.currency : ""}.${options.format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return { missing };
};
export default {
  fetchOverview,
  fetchDeliveryOptions,
  emailPayslip,
  emailAllPayslips,
  downloadBankFile,
  fetchPeriods,
  closePeriod,
  reopenPeriod,
  exportPayroll,
  generatePDF,
  signPDF,
  getAdjustments,
  createAdjustment,
  deleteAdjustment
}