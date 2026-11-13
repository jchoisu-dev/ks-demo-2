const { CONSTANT_UTC_OFFSET_MINUTES } = require('@/shared/constants');
const { dayjs } = require('../../shared/utils');
const adjustmentRepos = require("./adjustment.repository");
const periodService = require('../period/period.service');
const currencyService = require('../currency/currency.service');
const { ApiError, getStartEndOfMonth } = require('../../shared/utils');
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const round = (value) => Math.round(value * 100) / 100;
const PAGE_LIMIT = 5;
exports.getAdjustments = async ({ employeeId, month, calendarDay, page: requestedPage }) => {
  const employee = await adjustmentRepos.findEmployee(employeeId);
  if (!employee) throw new ApiError(404, "Employee not found");
  if (month && !MONTH.test(month)) throw new ApiError(400, "Invalid month, expected YYYY-MM");
  const anchor = month ? `${month}-01` : calendarDay ? dayjs.utc(calendarDay).format("YYYY-MM-DD") : dayjs.utc().utcOffset(CONSTANT_UTC_OFFSET_MINUTES).format("YYYY-MM-DD");
  const { beginDay, endDay } = await getStartEndOfMonth(anchor);
  const [adjustments, closed] = await Promise.all([
    adjustmentRepos.findAll({ employeeId, beginDay, endDay }),
    periodService.findClosedOverlap(beginDay, endDay)
  ]);
  const payCurrency = employee.salary?.currency || "SRD";
  const items = adjustments
    .map(adjustment => {
      const currency = adjustment.currency || payCurrency;
      return {
        id: String(adjustment._id),
        date: dayjs.utc(adjustment.date).format('YYYY-MM-DD'),
        type: adjustment.type,
        amount: round(adjustment.amount),
        currency,
        originalAmount: round(adjustment.originalAmount ?? adjustment.amount),
        exchangeRate: adjustment.exchangeRate ?? 1,
        converted: currency != payCurrency,
        scope: adjustment.scope || "date",
        reason: adjustment.reason || ""
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const lastPage = Math.max(1, Math.ceil(items.length / PAGE_LIMIT));
  const page = Math.min(Math.max(1, parseInt(requestedPage) || 1), lastPage);
  const totals = { bonus: 0, deduction: 0 };
  for (const item of items) totals[item.type] = round((totals[item.type] || 0) + item.amount);
  return {
    month: dayjs.utc(beginDay).format("YYYY-MM"),
    employee: {
      id: String(employee._id),
      name: [employee.userId?.firstName, employee.userId?.lastName].filter(Boolean).join(" "),
      currency: employee.salary?.currency || "SRD"
    },
    closed,
    totals: { ...totals, net: round(totals.bonus - totals.deduction) },
    items: items.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT),
    meta: {
      page,
      limit: PAGE_LIMIT,
      totalRecords: items.length,
      totalPages: Math.ceil(items.length / PAGE_LIMIT),
      hasNextPage: page * PAGE_LIMIT < items.length,
      hasPreviousPage: page > 1
    }
  };
}
exports.createAdjustment = async (input = {}) => {
  if (!["bonus", "deduction"].includes(input.type)) throw new ApiError(400, "Choose bonus or deduction");
  const originalAmount = Number(input.amount);
  if (!Number.isFinite(originalAmount) || originalAmount <= 0) throw new ApiError(400, "The amount must be more than 0");
  const employee = await adjustmentRepos.findEmployee(input.employeeId);
  if (!employee) throw new ApiError(404, "Employee not found");
  const payCurrency = employee.salary?.currency || "SRD";
  const currency = input.currency || payCurrency;
  const converted = await currencyService.convert(originalAmount, currency, payCurrency);
  const data = {
    employeeId: input.employeeId,
    type: input.type,
    amount: converted.amount,
    currency,
    originalAmount: round(originalAmount),
    exchangeRate: converted.rate,
    reason: String(input.reason || "").trim().slice(0, 200),
    scope: input.scope == "month" ? "month" : "date",
    date: input.date
  };
  if (data.scope == "month") {
    const month = input.month || (input.date ? dayjs.utc(input.date).format("YYYY-MM") : null);
    if (!month || !MONTH.test(month)) throw new ApiError(400, "Choose the month");
    data.date = `${month}-01`;
  }
  const day = data?.date ? dayjs.utc(data.date) : dayjs.utc().utcOffset(CONSTANT_UTC_OFFSET_MINUTES);
  const date = new Date(day.format('YYYY-MM-DD'));
  await periodService.assertOpen(date);
  const adjustment = await adjustmentRepos.createAdjustment({ ...data, date });
  if (!adjustment) throw new ApiError(404, "Adjustment not created");
  return adjustment;
};
exports.deleteAdjustment = async (id) => {
  const existing = await adjustmentRepos.findDate(id);
  await periodService.assertOpen(existing?.date);
  const deleted = await adjustmentRepos.delete(id);
  if (!deleted) throw new ApiError(404, "Adjustment not found");
  return deleted;
}