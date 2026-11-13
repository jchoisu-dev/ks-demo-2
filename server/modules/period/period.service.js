const mongoose = require("mongoose");
const repo = require("./period.repository");
const { ApiError, dayjs } = require('../../shared/utils');
const workHoursService = require('../workhours/workhours.service');
const taxService = require('../tax/tax.service');
const toDay = (value) => {
  const date = dayjs.utc(value);
  if (!value || !date.isValid()) throw new ApiError(400, "Choose a begin and end date");
  return new Date(date.format("YYYY-MM-DD"));
}
const label = (period) => `${dayjs.utc(period.beginDay).format("DD-MM-YYYY")} – ${dayjs.utc(period.endDay).format("DD-MM-YYYY")}`;
const serialize = (period) => ({
  id: String(period._id),
  beginDay: dayjs.utc(period.beginDay).format("YYYY-MM-DD"),
  endDay: dayjs.utc(period.endDay).format("YYYY-MM-DD"),
  closedAt: period.closedAt,
  closedBy: period.closedByName || ""
});
exports.isEnabled = async () => {
  const { lockPeriods } = await workHoursService.getWorkHours();
  return lockPeriods === true;
}
exports.getPeriods = async () => {
  const [enabled, periods] = await Promise.all([exports.isEnabled(), repo.findAll()]);
  const names = await closedByNames(periods);
  return {
    enabled,
    periods: periods.map(period => serialize({ ...period, closedByName: names[String(period.closedBy)] }))
  };
}
const closedByNames = async (periods) => {
  const ids = [...new Set(periods.map(period => period.closedBy).filter(Boolean).map(String))];
  if (!ids.length) return {};
  const users = await mongoose.model("User").find({ _id: { $in: ids } }, { firstName: 1, lastName: 1 }).lean();
  return Object.fromEntries(users.map(user => [String(user._id), [user.firstName, user.lastName].filter(Boolean).join(" ")]));
}
exports.closePeriod = async (body = {}, userId) => {
  if (!await exports.isEnabled()) throw new ApiError(400, "Closing payroll periods is turned off in Configuration → Payroll");
  const beginDay = toDay(body.beginDay);
  const endDay = toDay(body.endDay);
  if (endDay < beginDay) throw new ApiError(400, "The end date must be on or after the begin date");
  const overlap = await repo.findOverlapping({ beginDay, endDay });
  if (overlap) throw new ApiError(409, `This period overlaps the closed period ${label(overlap)}`);
  const [workHours, applyTax, tax, employees] = await Promise.all([
    workHoursService.getWorkHours(),
    taxService.getPayrollOptions().then(options => options.applyTax),
    taxService.getTaxSettings(endDay),
    repo.findEmployeesForSnapshot()
  ]);
  const period = await repo.create({
    beginDay,
    endDay,
    closedAt: new Date(),
    closedBy: userId,
    settings: {
      workHours: {
        weekday: workHours.weekday,
        saturday: workHours.saturday,
        sunday: workHours.sunday,
        overtimeRates: workHours.overtimeRates,
        saturdayDayValue: workHours.saturdayDayValue,
        sundayDayValue: workHours.sundayDayValue,
        overtimeOnBaseRate: workHours.overtimeOnBaseRate,
        overtimeOnWeekdayHours: workHours.overtimeOnWeekdayHours
      },
      applyTax,
      tax
    },
    employees: employees.map(employee => ({
      employeeId: employee._id,
      salary: employee.salary,
      incentive_weekdays: employee.incentive_weekdays,
      birthdate: employee.birthdate,
      hiredAt: employee.hiredAt,
      endWorkDay: employee.endWorkDay
    }))
  });
  const names = await closedByNames([period]);
  return serialize({ ...period, closedByName: names[String(period.closedBy)] });
}
exports.reopenPeriod = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "Payroll period not found");
  const period = await repo.reopen(id);
  if (!period) throw new ApiError(404, "Payroll period not found");
  return { id: String(id) };
}
exports.findClosedOverlap = async (beginDay, endDay) => {
  if (!await exports.isEnabled()) return null;
  const period = await repo.findOverlapping({
    beginDay: new Date(dayjs.utc(beginDay).format("YYYY-MM-DD")),
    endDay: new Date(dayjs.utc(endDay).format("YYYY-MM-DD"))
  });
  return period ? { beginDay: dayjs.utc(period.beginDay).format("YYYY-MM-DD"), endDay: dayjs.utc(period.endDay).format("YYYY-MM-DD") } : null;
}
exports.assertOpen = async (value) => {
  if (!value || !await exports.isEnabled()) return;
  const date = new Date(dayjs.utc(value).format("YYYY-MM-DD"));
  const period = await repo.findContaining(date);
  if (period) {
    throw new ApiError(409, `This date is in the closed payroll period ${label(period)}. Reopen the period to make changes.`);
  }
}
exports.getFrozenContext = async (beginDay, endDay) => {
  if (!beginDay || !endDay || !await exports.isEnabled()) return null;
  const period = await repo.findExact({
    beginDay: new Date(dayjs.utc(beginDay).format("YYYY-MM-DD")),
    endDay: new Date(dayjs.utc(endDay).format("YYYY-MM-DD"))
  });
  if (!period) return null;
  const employees = new Map(period.employees.map(employee => [String(employee.employeeId), employee]));
  return {
    id: String(period._id),
    closedAt: period.closedAt,
    workHours: { ...period.settings.workHours, lockPeriods: true },
    applyTax: Boolean(period.settings.applyTax),
    taxSettings: period.settings.tax || null,
    employeeIds: [...employees.keys()],
    fixedEmployeeIds: period.employees
      .filter(employee => ["monthly", "weekly"].includes(employee.salary?.payType))
      .map(employee => String(employee.employeeId)),
    freeze: (employee) => {
      const snapshot = employees.get(String(employee._id));
      if (!snapshot) return employee;
      const { employeeId, ...fields } = snapshot;
      return { ...employee, ...fields };
    }
  };
}
