const { ApiError, dayjs, getStartEndOfMonth, mTh, getWorkdaysMonth } = require('../../shared/utils');
const { CONSTANT_UTC_OFFSET_MINUTES } = require('@/shared/constants');
const { getPayrollData, getWorkHours, calculateSalary, isTaxEnabled } = require('../payroll/payroll.utils');
const repo = require('./dashboard.repository');
const payrollRepo = require('../payroll/payroll.repository');
const periodService = require('../period/period.service');
const MONTH_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;
const ATTENDANCE_TYPES = ["present", "overtime", "absent", "leave", "sick", "holiday"];
const EMPLOYEE_STATUSES = ["active", "inactive", "terminated"];
const EMPLOYEE_TYPES = ["full-time", "part-time", "contract", "freelancer"];
const PAY_TYPES = ["hourly", "daily", "weekly", "monthly"];
const CURRENCIES = ["SRD", "USD", "EUR"];
const TOP_OVERTIME_LIMIT = 5;
const ADJUSTMENTS_PAGE_LIMIT = 5;
const UPCOMING_HOLIDAYS_LIMIT = 5;
const toCountMap = (rows, keys) => {
  const map = Object.fromEntries(keys.map(key => [key, 0]));
  for (const row of rows) {
    if (row._id in map) map[row._id] = row.count;
  }
  return map;
}
const round = (value) => Math.round(value * 100) / 100;
const summarizeAdjustments = (adjustments) => {
  const summary = {
    bonus: { count: 0, byCurrency: Object.fromEntries(CURRENCIES.map(currency => [currency, 0])) },
    deduction: { count: 0, byCurrency: Object.fromEntries(CURRENCIES.map(currency => [currency, 0])) }
  };
  for (const adjustment of adjustments) {
    const group = summary[adjustment.type];
    if (!group) continue;
    const currency = adjustment.currency || "SRD";
    group.count += 1;
    group.byCurrency[currency] = round((group.byCurrency[currency] || 0) + adjustment.amount);
  }
  return {
    ...summary,
    total: adjustments.length
  };
};
const serializeAdjustment = (adjustment) => ({
  id: String(adjustment._id),
  employeeId: String(adjustment.employeeId),
  name: [adjustment.firstName, adjustment.lastName].filter(Boolean).join(" ") || "—",
  type: adjustment.type,
  amount: round(adjustment.amount),
  currency: adjustment.currency || "SRD",
  originalCurrency: adjustment.originalCurrency || adjustment.currency || "SRD",
  originalAmount: round(adjustment.originalAmount ?? adjustment.amount),
  date: dayjs.utc(adjustment.date).format("YYYY-MM-DD"),
  scope: adjustment.scope || "date",
  reason: adjustment.reason || ""
});
const resolveMonth = async (query) => {
  const today = dayjs.utc().utcOffset(CONSTANT_UTC_OFFSET_MINUTES).format("YYYY-MM-DD");
  if (query.month && !MONTH_FORMAT.test(query.month)) {
    throw new ApiError(400, "Invalid month, expected YYYY-MM");
  }
  const month = query.month || today.slice(0, 7);
  const { beginDay, endDay } = await getStartEndOfMonth(`${month}-01`);
  return { today, month, beginDay, endDay };
};
const groupAdjustments = (adjustments) => {
  const byEmployee = {};
  for (const adjustment of adjustments) {
    (byEmployee[String(adjustment.employeeId)] ||= []).push(adjustment);
  }
  return byEmployee;
};
const computePayroll = async ({ beginDay, endDay, frozen, payrollRecords, adjustmentsByEmployee }) => {
  const applyTax = frozen ? frozen.applyTax : await isTaxEnabled();
  const workHours = frozen ? frozen.workHours : await getWorkHours();
  const includesSaturday = workHours.saturday > 0;
  const workdays = await getWorkdaysMonth(beginDay, endDay, { saturday: includesSaturday });
  const rows = [];
  for (const record of payrollRecords) {
    const employee = frozen ? frozen.freeze(record.employee) : record.employee;
    const employeeId = String(record._id);
    const adjustments = adjustmentsByEmployee[employeeId] || [];
    const payrollData = await getPayrollData(record.payrollRecords, workHours);
    const salary = await calculateSalary({
      employee,
      payrollData,
      adjustments,
      beginDay,
      endDay,
      applyTax,
      taxSettings: frozen?.taxSettings
    });
    const user = employee.user || {};
    rows.push({
      employeeId,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      employee,
      currency: employee.salary.currency,
      payrollData,
      salary,
      adjustments
    });
  }
  return { applyTax, workHours, includesSaturday, workdays, rows };
};
exports.dashboard = async (query = {}) => {
  const { today, month, beginDay, endDay } = await resolveMonth(query);
  const todayDate = new Date(today);
  const frozen = await periodService.getFrozenContext(beginDay, endDay);
  const [
    byStatus,
    byType,
    byPayType,
    newHires,
    birthdays,
    todayStatus,
    monthAttendance,
    holidays,
    payrollRecords,
    adjustments
  ] = await Promise.all([
    repo.countEmployeesBy("status"),
    repo.countEmployeesBy("type", { status: "active" }),
    repo.countEmployeesBy("salary.payType", { status: "active" }),
    repo.countNewHires({ beginDay, endDay }),
    repo.findBirthdays(Number(month.slice(5, 7))),
    repo.countAttendanceStatusByDay(todayDate),
    repo.countAttendanceByType({ beginDay, endDay }),
    repo.findUpcomingHolidays(todayDate, UPCOMING_HOLIDAYS_LIMIT),
    payrollRepo.findPayrollRecords({ beginDay, endDay, includeIds: frozen?.employeeIds, fixedIds: frozen?.fixedEmployeeIds }),
    repo.findAdjustments({ beginDay, endDay })
  ]);
  const employeesByStatus = toCountMap(byStatus, EMPLOYEE_STATUSES);
  const todayByType = toCountMap(todayStatus, ATTENDANCE_TYPES);
  const todayRecorded = Object.values(todayByType).reduce((sum, count) => sum + count, 0);
  const hr = {
    employees: {
      total: Object.values(employeesByStatus).reduce((sum, count) => sum + count, 0),
      ...employeesByStatus,
      byType: toCountMap(byType, EMPLOYEE_TYPES),
      newHires
    },
    today: {
      date: today,
      recorded: todayRecorded,
      notRecorded: Math.max(employeesByStatus.active - todayRecorded, 0),
      byType: todayByType
    },
    attendance: {
      byType: toCountMap(monthAttendance, ATTENDANCE_TYPES)
    },
    upcomingHolidays: holidays.map(holiday => ({
      id: holiday._id,
      name: holiday.name,
      date: dayjs.utc(holiday.date).format("YYYY-MM-DD"),
      type: holiday.type
    })),
    birthdays: birthdays.map(employee => ({
      id: employee._id,
      name: `${employee.firstName} ${employee.lastName}`,
      date: dayjs.utc(employee.birthdate).format("MM-DD")
    }))
  };
  const adjustmentsByEmployee = groupAdjustments(adjustments);
  const emptyTotals = (currency) => ({
    currency,
    employees: 0,
    regularPay: 0,
    sundayPay: 0,
    overtimePay: 0,
    bonus: 0,
    deduction: 0,
    fullMonthBonus: 0,
    gross: 0,
    taxDeductions: 0,
    net: 0
  });
  const currencies = Object.fromEntries(CURRENCIES.map(currency => [currency, emptyTotals(currency)]));
  const overtime = [];
  let regularMinutes = 0;
  let overtimeMinutes = 0;
  let notCalculated = 0;
  const { applyTax, workHours, includesSaturday, workdays, rows } = await computePayroll({ beginDay, endDay, frozen, payrollRecords, adjustmentsByEmployee });
  for (const { employeeId, name, currency, payrollData, salary } of rows) {
    const totals = currencies[currency] ||= emptyTotals(currency);
    totals.employees += 1;
    for (const key of ["regularPay", "sundayPay", "overtimePay", "bonus", "deduction", "fullMonthBonus", "gross", "taxDeductions", "net"]) {
      totals[key] += salary[key];
    }
    if (!salary.isCalculated) notCalculated += 1;
    regularMinutes += payrollData.totalWeekDayMinutes;
    overtimeMinutes += payrollData.totalOvertimeMinutes;
    if (payrollData.totalOvertimeMinutes > 0) {
      overtime.push({
        id: employeeId,
        name,
        hours: round(await mTh(payrollData.totalOvertimeMinutes))
      });
    }
  }
  const payroll = {
    beginDay: dayjs.utc(beginDay).format("DD-MM-YYYY"),
    endDay: dayjs.utc(endDay).format("DD-MM-YYYY"),
    employees: payrollRecords.length,
    notCalculated,
    taxApplied: applyTax,
    closed: Boolean(frozen),
    byCurrency: Object.values(currencies)
      .map(totals => Object.fromEntries(
        Object.entries(totals).map(([key, value]) => [key, typeof value == "number" && key != "employees" ? round(value) : value])
      )),
    workdays: {
      count: workdays,
      includesSaturday
    },
    hours: {
      regular: round(await mTh(regularMinutes)),
      overtime: round(await mTh(overtimeMinutes))
    },
    byPayType: toCountMap(byPayType, PAY_TYPES),
    topOvertime: overtime
      .sort((a, b) => b.hours - a.hours)
      .slice(0, TOP_OVERTIME_LIMIT),
    adjustments: summarizeAdjustments(adjustments)
  };
  return {
    month,
    hr,
    payroll
  };
}
const BREAKDOWN_PAGE_LIMIT = 5;
const BREAKDOWN_ITEMS = ["regularPay", "sundayPay", "overtimePay", "bonus", "fullMonthBonus", "deduction", "taxDeductions", "net"];
const breakdownDetail = (item, { employee, payrollData, salary, adjustments }) => {
  const payType = employee.salary.payType;
  switch (item) {
    case "regularPay":
      if (salary.fixed) {
        return {
          kind: "fixed",
          payType,
          salary: employee.salary.amount,
          base: round(salary.fixed.base),
          scheduledDays: salary.fixed.scheduledDays,
          monthDays: salary.fixed.monthDays,
          dailyRate: round(salary.fixed.dailyRate),
          absentDays: salary.fixed.absentDays,
          absenceDeduction: round(salary.fixed.absenceDeduction)
        };
      }
      if (payType == "hourly") {
        return { kind: "hours", hours: round(payrollData.totalWeekDayMinutes / 60), rate: round(salary.effectiveRatePerHour) };
      }
      return {
        kind: "days",
        days: payrollData.totalWeekDays + salary.effectiveSaturdays,
        weekdays: payrollData.totalWeekDays,
        saturdays: payrollData.totalSaturdays,
        effectiveSaturdays: salary.effectiveSaturdays,
        rate: round(salary.effectiveRatePerDay),
        incentive: salary.isFullAttendance && Boolean(employee.incentive_weekdays?.amount)
      };
    case "sundayPay":
      return { days: salary.effectiveSundays, sundays: payrollData.totalSundays, rate: round(salary.effectiveRatePerDay) };
    case "overtimePay":
      return {
        groups: ["WORKDAY", "SATURDAY", "SUNDAY"]
          .map(dayType => ({ dayType, group: payrollData.overtimeByDayType?.[dayType] }))
          .filter(({ group }) => group?.minutes)
          .map(({ dayType, group }) => {
            const hourly = payType == "hourly" ? salary.overtimeRatePerHour : salary.overtimeRatePerDay / group.baseHours;
            return {
              dayType,
              hours: round(group.minutes / 60),
              hourlyRate: round(hourly),
              multiplier: group.rate,
              amount: round(group.minutes / 60 * hourly * group.rate)
            };
          })
      };
    case "bonus":
    case "deduction":
      return {
        items: adjustments
          .filter(adjustment => adjustment.type == item)
          .map(adjustment => ({
            date: dayjs.utc(adjustment.date).format("YYYY-MM-DD"),
            reason: adjustment.reason || "",
            amount: round(adjustment.amount)
          }))
      };
    case "fullMonthBonus":
      return { workdays: salary.fullMonthDays };
    case "taxDeductions":
      return {
        wageTax: round(salary.tax?.wageTax || 0),
        overtimeTax: round(salary.tax?.overtimeTax || 0),
        aov: round(salary.tax?.aov || 0),
        pension: round(salary.tax?.pensionEmployee || 0),
        health: round(salary.tax?.healthEmployee || 0)
      };
    case "net":
      return {
        gross: round(salary.gross),
        taxDeductions: round(salary.taxDeductions),
        deduction: round(salary.deduction)
      };
  }
};
exports.breakdown = async (query = {}) => {
  const currency = String(query.currency || "").toUpperCase();
  if (!CURRENCIES.includes(currency)) throw new ApiError(400, "Choose SRD, USD or EUR");
  if (!BREAKDOWN_ITEMS.includes(query.item)) throw new ApiError(400, "Unknown breakdown item");
  const page = Math.max(1, parseInt(query.page) || 1);
  const { month, beginDay, endDay } = await resolveMonth(query);
  const frozen = await periodService.getFrozenContext(beginDay, endDay);
  const [payrollRecords, adjustments] = await Promise.all([
    payrollRepo.findPayrollRecords({ beginDay, endDay, includeIds: frozen?.employeeIds, fixedIds: frozen?.fixedEmployeeIds }),
    repo.findAdjustments({ beginDay, endDay })
  ]);
  const { applyTax, workdays, rows } = await computePayroll({ beginDay, endDay, frozen, payrollRecords, adjustmentsByEmployee: groupAdjustments(adjustments) });
  const lines = rows
    .filter(row => row.currency == currency && round(row.salary[query.item] || 0) != 0)
    .map(row => ({
      employeeId: row.employeeId,
      employee: row.name,
      payType: row.employee.salary.payType,
      amount: round(row.salary[query.item]),
      detail: breakdownDetail(query.item, row)
    }))
    .sort((a, b) => b.amount - a.amount);
  return {
    month,
    currency,
    item: query.item,
    period: `${dayjs.utc(beginDay).format("DD-MM-YYYY")} – ${dayjs.utc(endDay).format("DD-MM-YYYY")}`,
    closed: Boolean(frozen),
    taxApplied: applyTax,
    workdays,
    total: round(lines.reduce((sum, line) => sum + line.amount, 0)),
    lines: lines.slice((page - 1) * BREAKDOWN_PAGE_LIMIT, page * BREAKDOWN_PAGE_LIMIT),
    meta: {
      page,
      limit: BREAKDOWN_PAGE_LIMIT,
      totalRecords: lines.length,
      totalPages: Math.ceil(lines.length / BREAKDOWN_PAGE_LIMIT),
      hasNextPage: page * BREAKDOWN_PAGE_LIMIT < lines.length,
      hasPreviousPage: page > 1
    }
  };
};
exports.adjustments = async (query = {}) => {
  const { beginDay, endDay } = await resolveMonth(query);
  const page = Math.max(1, parseInt(query.page) || 1);
  const { data, count } = await repo.findAdjustmentsPage({ beginDay, endDay, skip: (page - 1) * ADJUSTMENTS_PAGE_LIMIT, limit: ADJUSTMENTS_PAGE_LIMIT });
  return {
    data: data.map(serializeAdjustment),
    meta: {
      page,
      limit: ADJUSTMENTS_PAGE_LIMIT,
      totalRecords: count,
      totalPages: Math.ceil(count / ADJUSTMENTS_PAGE_LIMIT),
      hasNextPage: page * ADJUSTMENTS_PAGE_LIMIT < count,
      hasPreviousPage: page > 1
    }
  };
};
