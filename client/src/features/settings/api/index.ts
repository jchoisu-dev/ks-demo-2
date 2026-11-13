import axios from "@/shared/api/axios";
import type { Company, CompanyPayload } from "../company.types";
import type { WorkHours, WorkHoursPayload } from "../workHours.types";
import type { TaxVersions, TaxVersion, TaxPayload, TaxPreview, TaxPreviewInput, TaxPayrollOptions } from "../tax.types";
const getCompany = async (): Promise<Company> => {
  const { data } = await axios.get("/settings/company");
  return data;
};
const updateCompany = async (payload: CompanyPayload): Promise<Company> => {
  const { data } = await axios.put("/settings/company", payload);
  return data;
};
const getTaxVersions = async (): Promise<TaxVersions> => {
  const { data } = await axios.get("/settings/tax");
  return data;
};
const createTaxVersion = async (payload: TaxPayload): Promise<TaxVersion> => {
  const { data } = await axios.post("/settings/tax", payload);
  return data;
};
const updateTaxVersion = async (id: string, payload: TaxPayload): Promise<TaxVersion> => {
  const { data } = await axios.put(`/settings/tax/${id}`, payload);
  return data;
};
const deleteTaxVersion = async (id: string) => {
  const { data } = await axios.delete(`/settings/tax/${id}`);
  return data;
};
const previewTax = async (settings: TaxPayload, input: TaxPreviewInput): Promise<TaxPreview> => {
  const { data } = await axios.post("/settings/tax/preview", { settings, input });
  return data;
};
const getTaxPayrollOptions = async (): Promise<TaxPayrollOptions> => {
  const { data } = await axios.get("/settings/tax/payroll");
  return data;
};
const updateTaxPayrollOptions = async (payload: TaxPayrollOptions): Promise<TaxPayrollOptions> => {
  const { data } = await axios.put("/settings/tax/payroll", payload);
  return data;
};
const getWorkHours = async (): Promise<WorkHours> => {
  const { data } = await axios.get("/settings/work-hours");
  return data;
};
const updateWorkHours = async (payload: WorkHoursPayload): Promise<WorkHours> => {
  const { data } = await axios.put("/settings/work-hours", payload);
  return data;
};
export default {
  getCompany,
  updateCompany,
  getTaxVersions,
  createTaxVersion,
  updateTaxVersion,
  deleteTaxVersion,
  previewTax,
  getTaxPayrollOptions,
  updateTaxPayrollOptions,
  getWorkHours,
  updateWorkHours
}
