const companyService = require("../company/company.service");
const companyRepo = require("../company/company.repository");
const { ApiError } = require("../../shared/utils");
const CURRENCIES = ["SRD", "USD", "EUR"];
const PAIRS = ["USD_SRD", "SRD_USD", "EUR_SRD", "SRD_EUR", "USD_EUR", "EUR_USD"];
const MAX_RATE = 100000;
const round = (value, digits = 2) => Math.round(value * 10 ** digits) / 10 ** digits;
const serialize = (company) => {
  const stored = company?.exchangeRates || {};
  const rates = Object.fromEntries(PAIRS.map(pair => [pair, stored[pair] > 0 ? stored[pair] : null]));
  return {
    currencies: CURRENCIES,
    rates,
    configured: PAIRS.every(pair => rates[pair] != null),
    updatedAt: stored.updatedAt || null
  };
};
exports.CURRENCIES = CURRENCIES;
exports.getRates = async () => serialize(await companyRepo.findOne());
exports.updateRates = async (body = {}, userId) => {
  const input = body.rates || {};
  const data = {};
  for (const pair of PAIRS) {
    const raw = input[pair];
    if (raw === "" || raw == null) {
      data[`exchangeRates.${pair}`] = null;
      continue;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0 || value > MAX_RATE) {
      const [from, to] = pair.split("_");
      throw new ApiError(400, `The rate from ${from} to ${to} must be more than 0`);
    }
    data[`exchangeRates.${pair}`] = round(value, 6);
  }
  data["exchangeRates.updatedAt"] = new Date();
  return serialize(await companyService.updateSettings(data, userId));
};
exports.convert = async (amount, from, to) => {
  if (!CURRENCIES.includes(from) || !CURRENCIES.includes(to)) throw new ApiError(400, "Choose a valid currency");
  if (from == to) return { amount: round(amount), rate: 1 };
  const { rates } = await exports.getRates();
  const rate = rates[`${from}_${to}`];
  if (!rate) throw new ApiError(400, `Set the exchange rate from ${from} to ${to} under Configuration → Currencies first`);
  return { amount: round(amount * rate), rate };
};
