const repo = require("./leave.repository");
const workHoursService = require("../workhours/workhours.service");
const { ApiError, dayjs } = require('../../shared/utils');
const { CONSTANT_UTC_OFFSET_MINUTES } = require('@/shared/constants');
const PAGE_LIMIT = 10;
const roundHalf = (value) => Math.round(value * 2) / 2;
const monthsEmployed = (year, hiredAt, endWorkDay) => {
  const hired = hiredAt ? dayjs.utc(hiredAt) : null;
  const left = endWorkDay ? dayjs.utc(endWorkDay) : null;
  if (hired && hired.year() > year) return 0;
  if (left && left.year() < year) return 0;
  const firstMonth = hired && hired.year() == year ? hired.month() : 0;
  const lastMonth = left && left.year() == year ? left.month() : 11;
  return Math.max(0, lastMonth - firstMonth + 1);
}
exports.entitlementFor = ({ leaveDaysPerYear, hiredAt, endWorkDay }, defaultDays, year) => {
  const yearly = leaveDaysPerYear ?? defaultDays;
  const months = monthsEmployed(year, hiredAt, endWorkDay);
  return { yearly, months, entitlement: roundHalf(yearly * months / 12) };
}
exports.getBalances = async (query = {}) => {
  const currentYear = dayjs.utc().utcOffset(CONSTANT_UTC_OFFSET_MINUTES).year();
  const year = query.year === undefined || query.year === "" ? currentYear : Number(query.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new ApiError(400, "Choose a valid year");
  const page = Math.max(1, parseInt(query.page) || 1);
  const q = String(query.q || "").trim();
  const { leaveEnabled, leaveDaysPerYear: defaultDays } = await workHoursService.getWorkHours();
  if (!leaveEnabled) {
    return { enabled: false, year, defaultDays, data: [], meta: { page: 1, limit: PAGE_LIMIT, totalRecords: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
  }
  const { data, count } = await repo.findBalances({
    beginDay: new Date(Date.UTC(year, 0, 1)),
    endDay: new Date(Date.UTC(year + 1, 0, 1)),
    q,
    skip: (page - 1) * PAGE_LIMIT,
    limit: PAGE_LIMIT
  });
  return {
    enabled: true,
    year,
    defaultDays,
    data: data.map(employee => {
      const days = Object.fromEntries(employee.absences.map(({ _id, days }) => [_id, days]));
      const { yearly, months, entitlement } = exports.entitlementFor(employee, defaultDays, year);
      const taken = days.leave || 0;
      return {
        id: String(employee._id),
        employee: [employee.firstName, employee.lastName].filter(Boolean).join(" "),
        yearly,
        custom: employee.leaveDaysPerYear != null,
        months,
        entitlement,
        taken,
        remaining: roundHalf(entitlement - taken),
        sick: days.sick || 0
      };
    }),
    meta: {
      page,
      limit: PAGE_LIMIT,
      totalRecords: count,
      totalPages: Math.ceil(count / PAGE_LIMIT),
      hasNextPage: page * PAGE_LIMIT < count,
      hasPreviousPage: page > 1
    }
  };
}
