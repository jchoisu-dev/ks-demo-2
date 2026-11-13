const dayjs = require('dayjs');
const utc = require("dayjs/plugin/utc");
const { summarizeWorkdays, mTh, getWorkdaysMonth } = require('@/shared/utils');
const taxService = require('../tax/tax.service');
const workHoursService = require('../workhours/workhours.service');
const {
  CONSTANT_WORKDAY,
  CONSTANT_SATURDAY,
  CONSTANT_SUNDAY,
  CONSTANT_UTC_OFFSET_MINUTES
} = require('@/shared/constants');
dayjs.extend(utc);
exports.getStartEndOfMonth = async () => {
  const now = dayjs.utc();
  const beginDay = now.startOf("month").toDate();
  const endDay = now.endOf("month").toDate();
  return {
    beginDay,
    endDay
  };
};
exports.toQueryRange = (beginDay, endDay) => ({
  beginDay: dayjs.utc(beginDay).startOf("day").toDate(),
  endDay: dayjs.utc(endDay).startOf("day").add(1, "day").toDate()
});
exports.isTaxEnabled = async () => {
  const { applyTax } = await taxService.getPayrollOptions();
  return applyTax;
};
const ageOn = (birthdate, date) => birthdate ? dayjs.utc(date).diff(dayjs.utc(birthdate), "year") : null;
exports.calculateTax = async ({ employee, gross, overtime, endDay, settings = null }) => {
  if (employee.salary?.currency != "SRD") return { applied: false, reason: "currency" };
  const date = dayjs.utc(endDay).startOf("day").toDate();
  const result = await taxService.calculateForPayroll({ date, gross, overtime, age: ageOn(employee.birthdate, date), settings });
  return { applied: true, ...result };
};
exports.getWorkHours = async () => workHoursService.getWorkHours();
exports.FIXED_PAY_TYPES = ['monthly', 'weekly'];
exports.isFixedPay = (payType) => exports.FIXED_PAY_TYPES.includes(payType);
exports.getFixedSalary = async ({ employee, payrollData, beginDay, endDay }) => {
  const { amount, payType } = employee.salary;
  const { workHours, totalAbsent } = payrollData;
  const saturday = workHours.saturday > 0;
  const periodStart = dayjs.utc(beginDay).startOf("day");
  const periodEnd = dayjs.utc(endDay).startOf("day");
  const hired = employee.hiredAt ? dayjs.utc(employee.hiredAt).startOf("day") : null;
  const left = employee.endWorkDay ? dayjs.utc(employee.endWorkDay).startOf("day") : null;
  const start = hired && hired.isAfter(periodStart) ? hired : periodStart;
  const end = left && left.isBefore(periodEnd) ? left : periodEnd;
  let base = 0;
  let scheduledDays = 0;
  let dailyRate = 0;
  let monthDays = 0;
  if (!end.isBefore(start)) {
    if (payType == 'monthly') {
      for (let month = periodStart.startOf("month"); !month.isAfter(periodEnd); month = month.add(1, "month")) {
        const monthStart = month.startOf("month");
        const monthEnd = month.endOf("month").startOf("day");
        const workdaysInMonth = await getWorkdaysMonth(monthStart, monthEnd, { saturday });
        const from = start.isAfter(monthStart) ? start : monthStart;
        const to = end.isBefore(monthEnd) ? end : monthEnd;
        if (to.isBefore(from) || !workdaysInMonth) continue;
        const days = await getWorkdaysMonth(from, to, { saturday });
        base += amount * days / workdaysInMonth;
        scheduledDays += days;
        monthDays += workdaysInMonth;
        dailyRate = amount / workdaysInMonth;
      }
    } else {
      dailyRate = amount / (saturday ? 6 : 5);
      scheduledDays = await getWorkdaysMonth(start, end, { saturday });
      base = dailyRate * scheduledDays;
    }
  }
  const absentDays = payrollData.absentDates
    ? exports.getMonthlyAttendance({ employee, attendances: payrollData.absentDates.map(date => ({ type: "absent", date })), workHours, beginDay, endDay }).absent
    : totalAbsent;
  const absenceDeduction = Math.min(base, absentDays * dailyRate);
  return {
    base,
    scheduledDays,
    monthDays,
    dailyRate,
    hourlyRate: dailyRate / workHours.weekday,
    absentDays,
    absenceDeduction
  };
};
const MISSED_TYPES = ["absent", "sick", "leave"];
exports.getMonthlyAttendance = ({ employee, attendances = [], workHours, beginDay, endDay, today }) => {
  const periodStart = dayjs.utc(beginDay).startOf("day");
  const periodEnd = dayjs.utc(endDay).startOf("day");
  const hired = employee?.hiredAt ? dayjs.utc(employee.hiredAt).startOf("day") : null;
  const left = employee?.endWorkDay ? dayjs.utc(employee.endWorkDay).startOf("day") : null;
  const start = hired && hired.isAfter(periodStart) ? hired : periodStart;
  const end = left && left.isBefore(periodEnd) ? left : periodEnd;
  const saturday = (workHours?.saturday || 0) > 0;
  const currentDay = today || dayjs.utc().utcOffset(CONSTANT_UTC_OFFSET_MINUTES).format("YYYY-MM-DD");
  const scheduled = new Set();
  for (let date = start; !date.isAfter(end); date = date.add(1, "day")) {
    const weekday = date.day();
    if ((weekday >= 1 && weekday <= 5) || (weekday == 6 && saturday)) scheduled.add(date.format("YYYY-MM-DD"));
  }
  const worked = new Set();
  const missed = { absent: new Set(), sick: new Set(), leave: new Set() };
  for (const attendance of attendances) {
    const date = dayjs.utc(attendance.date).format("YYYY-MM-DD");
    if (!scheduled.has(date)) continue;
    if (attendance.type == "present") worked.add(date);
    if (MISSED_TYPES.includes(attendance.type)) missed[attendance.type].add(date);
  }
  const missedDates = new Set([...missed.absent, ...missed.sick, ...missed.leave].filter(date => !worked.has(date)));
  let notRecorded = 0;
  let upcoming = 0;
  for (const date of scheduled) {
    if (worked.has(date) || missedDates.has(date)) continue;
    if (date > currentDay) upcoming += 1;
    else notRecorded += 1;
  }
  const scheduledDays = scheduled.size;
  return {
    scheduledDays,
    workedDays: worked.size,
    missedDays: missedDates.size,
    absent: missed.absent.size,
    sick: missed.sick.size,
    leave: missed.leave.size,
    notRecorded,
    upcoming,
    complete: scheduledDays > 0 && worked.size == scheduledDays
  };
};
exports.getRates = ({ amount, payType }, workHours) => {
  let salaryRatePerHour = 0;
  let salaryRatePerDay = 0;
  if (payType == 'daily') {
    salaryRatePerHour = parseFloat((amount / workHours.weekday).toFixed(2));
    salaryRatePerDay = parseFloat(amount);
  }
  if (payType == 'hourly') {
    salaryRatePerHour = parseFloat(amount);
    salaryRatePerDay = workHours.weekday * parseFloat(amount);
  }
  return { salaryRatePerHour, salaryRatePerDay };
};
exports.getPayrollData = async (attendances, workHours) => {
  workHours ||= await exports.getWorkHours();
  let totalWeekDays = 0;
  let totalWeekDayMinutes = 0;
  let totalOvertimeDays = 0;
  let totalOvertimeMinutes = 0;
  let weightedOvertimeHours = 0;
  let weightedOvertimeShifts = 0;
  const overtimeByDayType = {};
  let totalSundays = 0;
  let totalSaturdays = 0;
  let totalLeave = 0;
  let totalAbsent = 0;
  let totalSick = 0;
  const days = Object.values(summarizeWorkdays(attendances, workHours));
  for (const day of days) {
    if (day.isWorkday) {
      switch (day.dayType) {
        case CONSTANT_WORKDAY:
          totalWeekDays += 1;
          totalWeekDayMinutes += day.regularMinutes;
          break;

        case CONSTANT_SATURDAY:
          totalSaturdays += 1;
          totalWeekDayMinutes += day.regularMinutes;
          break;

        case CONSTANT_SUNDAY:
          totalSundays += 1;
          break;
      }
    }

    if (day.overtimeMinutes > 0) {
      totalOvertimeDays += 1;
      totalOvertimeMinutes += day.overtimeMinutes;
      weightedOvertimeHours += day.overtimeMinutes / 60 * day.overtimeRate;
      weightedOvertimeShifts += day.overtimeMinutes / 60 / day.baseHours * day.overtimeRate;
      const group = overtimeByDayType[day.dayType] ||= { minutes: 0, rate: day.overtimeRate, baseHours: day.baseHours };
      group.minutes += day.overtimeMinutes;
    }
  }
  const absentDates = [];
  for (const { type, date } of attendances) {
    if (type == 'absent') absentDates.push(date);
    if (type == 'leave') {
      totalLeave += 1;
    }

    if (type == 'absent') {
      totalAbsent += 1;
    }

    if (type == 'sick') {
      totalSick += 1;
    }
  }

  return {
    totalWeekDays,
    effectiveSaturdays: Math.round(totalSaturdays * exports.saturdayDayValue(workHours) * 100) / 100,
    effectiveSundays: Math.round(totalSundays * exports.sundayDayValue(workHours) * 100) / 100,
    totalWeekDayMinutes,
    totalOvertimeDays,
    totalOvertimeMinutes,
    weightedOvertimeHours,
    weightedOvertimeShifts,
    overtimeByDayType,
    totalSundays,
    totalSaturdays,
    totalLeave,
    totalAbsent,
    absentDates,
    totalSick,
    days,
    workHours
  }
}
exports.saturdayDayValue = (workHours) => workHours?.saturdayDayValue ?? 1;
exports.sundayDayValue = (workHours) => workHours?.sundayDayValue ?? 1;
exports.overtimeOnBaseRate = (workHours) => workHours?.overtimeOnBaseRate === true;
exports.calculateSalary = async ({ employee, payrollData, adjustments, beginDay, endDay, applyTax = false, taxSettings = null }) => {
  const { amount, payType } = employee.salary;
  const {
    totalWeekDays,
    totalWeekDayMinutes,
    totalOvertimeMinutes,
    totalSundays,
    totalSaturdays,
    effectiveSaturdays,
    effectiveSundays,
    workHours
  } = payrollData;
  const { salaryRatePerHour, salaryRatePerDay } = exports.getRates({ amount, payType }, workHours);
  let bonus = 0;
  let deduction = 0;
  for (const adjustment of adjustments) {
    if (adjustment.type == 'bonus') bonus += adjustment.amount;
    if (adjustment.type == 'deduction') deduction += adjustment.amount;
  }
  const incentiveFullMonthSingleBonus = employee.incentive_monthly?.amount || 0;
  const incentiveFullAttendanceRate = employee.incentive_weekdays?.amount || 0;
  const isFixed = exports.isFixedPay(payType);
  const fixed = isFixed ? await exports.getFixedSalary({ employee, payrollData, beginDay, endDay }) : null;
  const fullMonthDays = await getWorkdaysMonth(beginDay, endDay, { saturday: workHours.saturday > 0 });
  const isFullAttendance = isFixed ? fixed.absentDays == 0 && fixed.scheduledDays > 0 : (totalWeekDays + totalSaturdays) == fullMonthDays;
  const effectiveRatePerDay = isFixed ? fixed.dailyRate : (isFullAttendance && incentiveFullAttendanceRate) ? incentiveFullAttendanceRate : salaryRatePerDay;
  const effectiveRatePerHour = isFixed ? fixed.hourlyRate : (isFullAttendance && incentiveFullAttendanceRate) ? incentiveFullAttendanceRate : salaryRatePerHour;
  const onBase = exports.overtimeOnBaseRate(workHours);
  const overtimeRatePerDay = isFixed ? fixed.dailyRate : onBase ? salaryRatePerDay : effectiveRatePerDay;
  const overtimeRatePerHour = isFixed ? fixed.hourlyRate : onBase ? salaryRatePerHour : effectiveRatePerHour;
  const isCalculated = payType == 'daily' || payType == 'hourly' || isFixed;
  let regularPay = 0;
  let sundayPay = 0;
  let overtimePay = 0;
  if (payType == 'daily') {
    regularPay = (totalWeekDays + effectiveSaturdays) * effectiveRatePerDay;
  }
  if (payType == 'hourly') {
    regularPay = (await mTh(totalWeekDayMinutes)) * effectiveRatePerHour;
  }
  if (isFixed) {
    regularPay = fixed.base - fixed.absenceDeduction;
  }
  if (isCalculated) {
    sundayPay = effectiveSundays * effectiveRatePerDay;
    overtimePay = payType == 'hourly'
      ? payrollData.weightedOvertimeHours * overtimeRatePerHour
      : payrollData.weightedOvertimeShifts * overtimeRatePerDay;
  }
  const fullMonthBonus = (isFullAttendance && incentiveFullMonthSingleBonus) ? incentiveFullMonthSingleBonus : 0;
  const gross = regularPay + sundayPay + bonus + fullMonthBonus;
  const tax = (applyTax && isCalculated) ? await exports.calculateTax({ employee, gross, overtime: overtimePay, endDay, settings: taxSettings }) : null;
  const taxDeductions = tax?.applied ? tax.totalDeductions : 0;
  const net = gross + overtimePay - taxDeductions - deduction;
  return {
    isCalculated,
    isFullAttendance,
    fullMonthDays,
    effectiveRatePerDay,
    effectiveRatePerHour,
    overtimeRatePerDay,
    overtimeRatePerHour,
    effectiveSaturdays,
    effectiveSundays,
    regularPay,
    sundayPay,
    overtimePay,
    bonus,
    deduction,
    fullMonthBonus,
    fixed,
    gross: gross + overtimePay,
    tax,
    taxDeductions,
    net
  };
};
