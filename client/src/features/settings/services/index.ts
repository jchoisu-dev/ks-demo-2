import api from "../api";
import type { CompanyPayload } from "../company.types";
import type { WorkHoursPayload } from "../workHours.types";
import type { TaxPayload, TaxPreviewInput, TaxPayrollOptions } from "../tax.types";
export const fetchCompany = async () => {
  const company = await api.getCompany();
  return company;
};
export const updateCompany = async (payload: CompanyPayload) => {
  const company = await api.updateCompany(payload);
  return company;
};
export const fetchTaxVersions = async () => {
  const taxVersions = await api.getTaxVersions();
  return taxVersions;
};
export const saveTaxVersion = async ({ id, payload }: { id: string | null; payload: TaxPayload }) => {
  const taxVersion = id ? await api.updateTaxVersion(id, payload) : await api.createTaxVersion(payload);
  return taxVersion;
};
export const deleteTaxVersion = async (id: string) => {
  const result = await api.deleteTaxVersion(id);
  return result;
};
export const previewTax = async ({ settings, input }: { settings: TaxPayload; input: TaxPreviewInput }) => {
  const preview = await api.previewTax(settings, input);
  return preview;
};
export const fetchTaxPayrollOptions = async () => {
  const options = await api.getTaxPayrollOptions();
  return options;
};
export const updateTaxPayrollOptions = async (payload: TaxPayrollOptions) => {
  const options = await api.updateTaxPayrollOptions(payload);
  return options;
};
export const fetchWorkHours = async () => {
  const workHours = await api.getWorkHours();
  return workHours;
};
export const updateWorkHours = async (payload: WorkHoursPayload) => {
  const workHours = await api.updateWorkHours(payload);
  return workHours;
};
export default {
  fetchCompany,
  updateCompany,
  fetchTaxVersions,
  saveTaxVersion,
  deleteTaxVersion,
  previewTax,
  fetchTaxPayrollOptions,
  updateTaxPayrollOptions,
  fetchWorkHours,
  updateWorkHours
}
