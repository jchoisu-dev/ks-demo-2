const DEFAULTS = {
  effectiveFrom: new Date("2025-07-01"),
  reference: "S.B. 2024 no. 2",
  notes: "",
  wageTax: {
    taxFreeAllowance: 108000,
    deductibleCostsRate: 4,
    deductibleCostsMax: 4800,
    taxCredit: 0,
    medicalAddition: 0,
    brackets: [
      { upTo: 42000, rate: 8 },
      { upTo: 84000, rate: 18 },
      { upTo: 126000, rate: 28 },
      { upTo: null, rate: 38 }
    ]
  },
  overtimeTax: {
    brackets: [
      { upTo: 2500, rate: 5 },
      { upTo: 7500, rate: 15 },
      { upTo: null, rate: 25 }
    ]
  },
  specialPayments: {
    brackets: [
      { upTo: 42000, rate: 5 },
      { upTo: 84000, rate: 15 },
      { upTo: 126000, rate: 25 },
      { upTo: null, rate: 35 }
    ]
  },
  exemptions: {
    holidayAllowance: 19500,
    bonus: 19500,
    childAllowancePerChild: 125,
    childAllowanceMax: 500
  },
  aov: {
    rate: 4,
    maxAge: 60
  },
  pension: {
    rate: 3,
    employerShare: 50
  },
  healthInsurance: {
    employerShare: 50,
    bands: [
      { fromAge: 0, toAge: 16, monthly: 55 },
      { fromAge: 17, toAge: 20, monthly: 75 },
      { fromAge: 21, toAge: 59, monthly: 165 },
      { fromAge: 60, toAge: null, monthly: 240 }
    ]
  }
};
const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const progressiveTax = (amount, brackets, divisor = 1) => {
  let tax = 0;
  let lower = 0;
  for (const { upTo, rate } of brackets) {
    const upper = upTo == null ? Infinity : upTo / divisor;
    if (amount <= lower) break;
    tax += (Math.min(amount, upper) - lower) * rate / 100;
    lower = upper;
  }
  return tax;
}
const healthPremium = (bands, age) => {
  const band = bands.find(({ fromAge, toAge }) => age >= fromAge && (toAge == null || age <= toAge));
  return band ? band.monthly : 0;
}
const calculateMonthly = (settings, { gross = 0, overtime = 0, age = null } = {}) => {
  const { wageTax, overtimeTax, aov, pension, healthInsurance } = settings;
  const deductibleCosts = Math.min(gross * wageTax.deductibleCostsRate / 100, wageTax.deductibleCostsMax / 12);
  const netWage = gross - deductibleCosts;
  const taxFreeAllowance = wageTax.taxFreeAllowance / 12;
  const taxableWage = Math.max(0, netWage + (wageTax.medicalAddition || 0) - taxFreeAllowance);
  const wageTaxAmount = Math.max(0, progressiveTax(taxableWage, wageTax.brackets, 12) - (wageTax.taxCredit || 0) / 12);
  const overtimeTaxAmount = progressiveTax(overtime, overtimeTax.brackets, 1);
  const aovDue = age == null || age < aov.maxAge;
  const aovAmount = aovDue ? (netWage + overtime) * aov.rate / 100 : 0;
  const pensionTotal = gross * (pension?.rate || 0) / 100;
  const pensionEmployee = pensionTotal * (100 - (pension?.employerShare || 0)) / 100;
  const healthTotal = age == null ? 0 : healthPremium(healthInsurance?.bands || [], age);
  const healthEmployee = healthTotal * (100 - (healthInsurance?.employerShare || 0)) / 100;
  const totalDeductions = wageTaxAmount + overtimeTaxAmount + aovAmount + pensionEmployee + healthEmployee;
  return {
    gross: round(gross),
    overtime: round(overtime),
    deductibleCosts: round(deductibleCosts),
    netWage: round(netWage),
    taxFreeAllowance: round(taxFreeAllowance),
    taxableWage: round(taxableWage),
    wageTax: round(wageTaxAmount),
    overtimeTax: round(overtimeTaxAmount),
    aov: round(aovAmount),
    pensionEmployee: round(pensionEmployee),
    pensionEmployer: round(pensionTotal - pensionEmployee),
    healthEmployee: round(healthEmployee),
    healthEmployer: round(healthTotal - healthEmployee),
    totalDeductions: round(totalDeductions),
    netPay: round(gross + overtime - totalDeductions)
  };
}
module.exports = {
  DEFAULTS,
  progressiveTax,
  calculateMonthly
}
