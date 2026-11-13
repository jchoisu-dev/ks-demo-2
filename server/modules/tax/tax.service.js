const repo = require("./tax.repository");
const { ApiError, dayjs } = require('../../shared/utils');
const { DEFAULTS, calculateMonthly } = require('./tax.utils');
const companyService = require('../company/company.service');
const EDITABLE_FIELDS = [
  "effectiveFrom",
  "reference",
  "notes",
  "wageTax",
  "overtimeTax",
  "specialPayments",
  "exemptions",
  "aov",
  "pension",
  "healthInsurance"
];
const pick = (body = {}) => {
  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
}
const serialize = (tax, id = null) => ({
  id: id ?? (tax._id ? String(tax._id) : null),
  effectiveFrom: dayjs.utc(tax.effectiveFrom).format("YYYY-MM-DD"),
  reference: tax.reference || "",
  notes: tax.notes || "",
  wageTax: {
    taxFreeAllowance: tax.wageTax.taxFreeAllowance,
    deductibleCostsRate: tax.wageTax.deductibleCostsRate,
    deductibleCostsMax: tax.wageTax.deductibleCostsMax,
    taxCredit: tax.wageTax.taxCredit || 0,
    medicalAddition: tax.wageTax.medicalAddition || 0,
    brackets: tax.wageTax.brackets.map(({ upTo, rate }) => ({ upTo: upTo ?? null, rate }))
  },
  overtimeTax: {
    brackets: tax.overtimeTax.brackets.map(({ upTo, rate }) => ({ upTo: upTo ?? null, rate }))
  },
  specialPayments: {
    brackets: tax.specialPayments.brackets.map(({ upTo, rate }) => ({ upTo: upTo ?? null, rate }))
  },
  exemptions: { ...tax.exemptions },
  aov: { rate: tax.aov.rate, maxAge: tax.aov.maxAge },
  pension: { rate: tax.pension?.rate ?? 0, employerShare: tax.pension?.employerShare ?? 50 },
  healthInsurance: {
    employerShare: tax.healthInsurance?.employerShare ?? 50,
    bands: (tax.healthInsurance?.bands || []).map(({ fromAge, toAge, monthly }) => ({ fromAge, toAge: toAge ?? null, monthly }))
  },
  updatedAt: tax.updatedAt || null
});
const validateBrackets = (brackets, label) => {
  if (!Array.isArray(brackets) || brackets.length == 0) {
    throw new ApiError(400, `${label}: add at least one bracket`);
  }
  brackets.forEach(({ upTo }, index) => {
    const isLast = index == brackets.length - 1;
    if (isLast && upTo != null) throw new ApiError(400, `${label}: the last bracket must have no upper limit`);
    if (!isLast && upTo == null) throw new ApiError(400, `${label}: only the last bracket can have no upper limit`);
    if (!isLast && index > 0 && upTo <= brackets[index - 1].upTo) {
      throw new ApiError(400, `${label}: bracket limits must increase`);
    }
  });
}
const validateBands = (bands) => {
  if (!Array.isArray(bands) || bands.length == 0) return;
  bands.forEach(({ fromAge, toAge }, index) => {
    const isLast = index == bands.length - 1;
    if (index == 0 && fromAge != 0) throw new ApiError(400, "Health insurance: the first age band must start at 0");
    if (index > 0 && fromAge != bands[index - 1].toAge + 1) throw new ApiError(400, "Health insurance: age bands must follow each other without gaps");
    if (!isLast && (toAge == null || toAge < fromAge)) throw new ApiError(400, "Health insurance: each age band needs an end age after its start");
    if (isLast && toAge != null) throw new ApiError(400, "Health insurance: the last age band must have no upper age");
  });
}
const validate = (data) => {
  const candidate = repo.build(data);
  const error = candidate.validateSync();
  if (error) {
    const [first] = Object.values(error.errors);
    throw new ApiError(400, first.message);
  }
  validateBrackets(data.wageTax?.brackets, "Wage tax");
  validateBrackets(data.overtimeTax?.brackets, "Overtime tax");
  validateBrackets(data.specialPayments?.brackets, "Special payments");
  validateBands(data.healthInsurance?.bands);
}
const toDate = (value) => {
  const date = dayjs.utc(value);
  if (!value || !date.isValid()) throw new ApiError(400, "Effective date is required");
  return new Date(date.format("YYYY-MM-DD"));
}
exports.listVersions = async () => {
  const versions = await repo.findAll();
  return {
    versions: versions.map(version => serialize(version)),
    defaults: serialize(DEFAULTS, null)
  };
}
exports.getTaxSettings = async (date = new Date()) => {
  const version = await repo.findInForce(date);
  return version ? serialize(version) : serialize(DEFAULTS, null);
}
exports.createVersion = async (body, userId) => {
  const data = pick(body);
  data.effectiveFrom = toDate(data.effectiveFrom);
  validate(data);
  if (await repo.findByEffectiveFrom(data.effectiveFrom)) {
    throw new ApiError(409, "A version with this effective date already exists");
  }
  const created = await repo.create({ ...data, updatedBy: userId });
  return serialize(created);
}
exports.updateVersion = async (id, body, userId) => {
  const current = await repo.findById(id).catch(() => null);
  if (!current) throw new ApiError(404, "Tax version not found");
  const data = pick(body);
  if (data.effectiveFrom !== undefined) data.effectiveFrom = toDate(data.effectiveFrom);
  validate({ ...current, ...data });
  if (data.effectiveFrom) {
    const clash = await repo.findByEffectiveFrom(data.effectiveFrom);
    if (clash && String(clash._id) != String(id)) throw new ApiError(409, "A version with this effective date already exists");
  }
  const updated = await repo.update(id, { ...data, updatedBy: userId });
  return serialize(updated);
}
exports.deleteVersion = async (id) => {
  const deleted = await repo.delete(id).catch(() => null);
  if (!deleted) throw new ApiError(404, "Tax version not found");
  return { id };
}
exports.preview = async (body = {}) => {
  const settings = pick(body.settings || {});
  settings.effectiveFrom = settings.effectiveFrom || DEFAULTS.effectiveFrom;
  validate(settings);
  const toNumber = (value) => Math.max(0, Number(value) || 0);
  const input = body.input || {};
  const age = input.age === "" || input.age == null ? null : toNumber(input.age);
  return calculateMonthly(settings, { gross: toNumber(input.gross), overtime: toNumber(input.overtime), age });
}
exports.getPayrollOptions = async () => {
  const payroll = await repo.findPayrollOptions();
  return { applyTax: payroll.applyTax === true };
}
exports.updatePayrollOptions = async (body = {}, userId) => {
  if (typeof body.applyTax != "boolean") throw new ApiError(400, "applyTax must be true or false");
  const company = await companyService.updateSettings({ "payroll.applyTax": body.applyTax }, userId);
  return { applyTax: company.payroll?.applyTax === true };
}
exports.calculateForPayroll = async ({ date, gross, overtime, age, settings: frozen = null }) => {
  const settings = frozen || await exports.getTaxSettings(date);
  return { version: { id: settings.id, effectiveFrom: settings.effectiveFrom, reference: settings.reference }, ...calculateMonthly(settings, { gross, overtime, age }) };
}
