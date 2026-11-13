const mongoose = require("mongoose");
const repo = require("./payout.repository");
const payrollService = require("../payroll/payroll.service");
const currencyService = require("../currency/currency.service");
const requestContext = require("../../shared/utils/requestContext");
const { ApiError, dayjs } = require("../../shared/utils");
const { CONSTANT_UTC_OFFSET_MINUTES } = require("@/shared/constants");
const METHODS = ["cash", "bank", "other"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const round = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const day = (value) => dayjs.utc(value).format("YYYY-MM-DD");
const periodOf = (beginDay, endDay) => {
  if (!beginDay || !endDay || !dayjs.utc(beginDay).isValid() || !dayjs.utc(endDay).isValid()) throw new ApiError(400, "Choose the pay period");
  return { beginDay: new Date(day(beginDay)), endDay: new Date(day(endDay)) };
};
const statusOf = (net, paid) => {
  if (paid <= 0) return "unpaid";
  if (paid + 0.005 >= net) return paid > net + 0.005 ? "overpaid" : "paid";
  return "partial";
};
const serializeLine = (line) => ({
  id: String(line._id),
  date: day(line.date),
  payAmount: line.payAmount,
  currency: line.currency,
  amount: line.amount,
  rate: line.rate,
  method: line.method,
  note: line.note || ""
});
const summary = (net, payout) => {
  const lines = (payout?.lines || []).map(serializeLine).sort((a, b) => a.date.localeCompare(b.date));
  const paid = round(lines.reduce((sum, line) => sum + line.payAmount, 0));
  return { lines, paid, outstanding: round(Math.max(0, net - paid)), status: statusOf(net, paid) };
};
const loadNet = async (employeeId, beginDay, endDay) => {
  if (!mongoose.isValidObjectId(employeeId)) throw new ApiError(404, "Employee not found");
  const nets = await payrollService.netPayFor({ beginDay, endDay, employeeIds: [employeeId] });
  const net = nets.get(String(employeeId));
  if (!net) throw new ApiError(404, "This employee has no payroll in this period");
  return net;
};
exports.getPayout = async ({ employeeId, beginDay, endDay }) => {
  const period = periodOf(beginDay, endDay);
  const net = await loadNet(employeeId, period.beginDay, period.endDay);
  const payout = await repo.findOne({ employeeId, ...period });
  const { rates } = await currencyService.getRates();
  return {
    employee: { id: String(employeeId), name: net.name },
    period: { beginDay: day(period.beginDay), endDay: day(period.endDay) },
    payCurrency: net.currency,
    net: net.net,
    isCalculated: net.isCalculated,
    rates,
    ...summary(net.net, payout)
  };
};
exports.statusesFor = async ({ nets, beginDay, endDay }) => {
  const period = periodOf(beginDay, endDay);
  const payouts = await repo.findForPeriod({ employeeIds: [...nets.keys()], ...period });
  const byEmployee = new Map(payouts.map(payout => [String(payout.employeeId), payout]));
  const result = new Map();
  for (const [employeeId, net] of nets) {
    const { paid, outstanding, status } = summary(net.net, byEmployee.get(employeeId));
    result.set(employeeId, { net: net.net, currency: net.currency, paid, outstanding, status });
  }
  return result;
};
exports.addLine = async ({ employeeId, beginDay, endDay, ...body }) => {
  const period = periodOf(beginDay, endDay);
  const net = await loadNet(employeeId, period.beginDay, period.endDay);
  const payAmount = round(Number(body.payAmount));
  if (!(payAmount > 0)) throw new ApiError(400, "Enter the amount to pay out");
  const currency = body.currency || net.currency;
  if (!currencyService.CURRENCIES.includes(currency)) throw new ApiError(400, "Choose a valid currency");
  const method = METHODS.includes(body.method) ? body.method : "cash";
  const dateValue = body.date || dayjs.utc().utcOffset(CONSTANT_UTC_OFFSET_MINUTES).format("YYYY-MM-DD");
  if (!DATE.test(dateValue) || !dayjs.utc(dateValue).isValid()) throw new ApiError(400, "Choose a valid date");
  const rate = currency == net.currency ? 1 : (await currencyService.convert(1, net.currency, currency)).rate;
  const payout = await repo.findDocument({ employeeId, ...period });
  const already = round((payout?.lines || []).reduce((sum, line) => sum + line.payAmount, 0));
  if (already + payAmount > net.net + 0.005) {
    throw new ApiError(400, `This would pay out more than the net pay. Still open: ${net.currency} ${round(Math.max(0, net.net - already)).toFixed(2)}`);
  }
  const line = {
    date: new Date(dateValue),
    payAmount,
    currency,
    amount: round(payAmount * rate),
    rate: Math.round(rate * 1e6) / 1e6,
    method,
    note: String(body.note || "").trim().slice(0, 200),
    recordedBy: requestContext.get()?.userId || null
  };
  if (payout) {
    payout.lines.push(line);
    await payout.save();
  } else {
    await repo.create({ employeeId, ...period, payCurrency: net.currency, lines: [line] });
  }
  return await exports.getPayout({ employeeId, beginDay, endDay });
};
exports.deleteLine = async ({ employeeId, beginDay, endDay, lineId }) => {
  const period = periodOf(beginDay, endDay);
  const payout = await repo.findDocument({ employeeId, ...period });
  const line = payout && mongoose.isValidObjectId(lineId) ? payout.lines.id(lineId) : null;
  if (!line) throw new ApiError(404, "Payment not found");
  line.deleteOne();
  await payout.save();
  return await exports.getPayout({ employeeId, beginDay, endDay });
};
