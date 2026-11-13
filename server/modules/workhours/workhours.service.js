const repo = require("./workhours.repository");
const companyService = require("../company/company.service");
const { ApiError } = require('../../shared/utils');
const DEFAULTS = {
  weekday: 8,
  saturday: 8,
  sunday: 8,
  overtimeRate: 1.5,
  saturdayDayValue: 0.5,
  sundayDayValue: 1,
  overtimeRateSource: "base",
  overtimeHoursBase: "weekday"
};
const DAY_VALUE_LIMITS = [0, 3];
const RATE_SOURCES = ["base", "bonus"];
const HOURS_BASES = ["weekday", "day"];
const DAY_KEYS = ["weekday", "saturday", "sunday"];
const LIMITS = {
  weekday: [0.25, 24, "Weekday hours must be between 0.25 and 24"],
  saturday: [0, 24, "Saturday hours must be between 0 and 24"],
  sunday: [0, 24, "Sunday hours must be between 0 and 24"]
};
const RATE_LIMITS = [1, 5];
const DEFAULT_LEAVE_DAYS = 12;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
const toTime = (minutes) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
};
const shiftMinutes = ({ begin, end, breakMinutes }) => {
  let span = toMinutes(end) - toMinutes(begin);
  if (span <= 0) span += 1440;
  return span - (breakMinutes || 0);
};
const shiftFromHours = (hours) => {
  const breakMinutes = hours >= 6 ? 60 : 0;
  const begin = 8 * 60;
  return {
    working: hours > 0,
    begin: toTime(begin),
    end: toTime(begin + Math.round(hours * 60) + breakMinutes),
    breakMinutes
  };
};
const DAY_LABELS = { weekday: "Weekday", saturday: "Saturday", sunday: "Sunday" };
const validateShift = (day, shift) => {
  const label = DAY_LABELS[day];
  if (!shift || typeof shift != "object") throw new ApiError(400, `${label}: enter the standard work time`);
  const working = day == "weekday" ? true : shift.working !== false;
  if (!working) return { shift: { working: false, begin: "", end: "", breakMinutes: 0 }, hours: 0 };
  const begin = String(shift.begin || "");
  const end = String(shift.end || "");
  const breakMinutes = Number(shift.breakMinutes || 0);
  if (!TIME.test(begin) || !TIME.test(end)) throw new ApiError(400, `${label}: enter a start and end time (HH:mm)`);
  if (!Number.isFinite(breakMinutes) || breakMinutes < 0) throw new ApiError(400, `${label}: the break must be 0 minutes or more`);
  const minutes = shiftMinutes({ begin, end, breakMinutes });
  if (minutes < 15) throw new ApiError(400, `${label}: the work time must be at least 15 minutes after the break`);
  return { shift: { working: true, begin, end, breakMinutes }, hours: round(minutes / 60) };
};
const round = (value) => Math.round(value * 100) / 100;
const serialize = (company) => {
  const hours = company?.payroll?.standardHours || {};
  return {
    weekday: hours.weekday ?? DEFAULTS.weekday,
    saturday: hours.saturday ?? DEFAULTS.saturday,
    sunday: hours.sunday ?? DEFAULTS.sunday,
    shifts: Object.fromEntries(DAY_KEYS.map(day => {
      const stored = company?.payroll?.shifts?.[day];
      if (stored && (stored.working === false || (stored.begin && stored.end))) {
        return [day, { working: stored.working !== false, begin: stored.begin || "", end: stored.end || "", breakMinutes: stored.breakMinutes || 0 }];
      }
      return [day, shiftFromHours(hours[day] ?? DEFAULTS[day])];
    })),
    overtimeRates: Object.fromEntries(DAY_KEYS.map(day => [
      day,
      company?.payroll?.overtimeRates?.[day] ?? company?.payroll?.overtimeMultiplier ?? DEFAULTS.overtimeRate
    ])),
    saturdayDayValue: company?.payroll?.saturdayDayValue ?? DEFAULTS.saturdayDayValue,
    sundayDayValue: company?.payroll?.sundayDayValue ?? DEFAULTS.sundayDayValue,
    overtimeRateSource: company?.payroll?.overtimeRateSource ?? DEFAULTS.overtimeRateSource,
    overtimeHoursBase: company?.payroll?.overtimeHoursBase ?? DEFAULTS.overtimeHoursBase,
    overtimeOnBaseRate: (company?.payroll?.overtimeRateSource ?? DEFAULTS.overtimeRateSource) == "base",
    overtimeOnWeekdayHours: (company?.payroll?.overtimeHoursBase ?? DEFAULTS.overtimeHoursBase) == "weekday",
    lockPeriods: company?.payroll?.lockPeriods === true,
    leaveEnabled: company?.payroll?.leaveEnabled !== false,
    leaveDaysPerYear: company?.payroll?.leaveDaysPerYear ?? DEFAULT_LEAVE_DAYS,
    configured: company?.payroll?.standardHours?.weekday != null,
    updatedAt: company?.updatedAt || null
  };
}
exports.getWorkHours = async () => {
  return serialize(await repo.findOne());
}
exports.updateWorkHours = async (body = {}, userId) => {
  const data = {};
  let shifts = null;
  if (body.shifts) {
    shifts = {};
    for (const day of DAY_KEYS) {
      const { shift, hours } = validateShift(day, body.shifts[day]);
      shifts[day] = shift;
      data[day] = hours;
    }
  }
  for (const [field, [min, max, message]] of Object.entries(shifts ? {} : LIMITS)) {
    const value = Number(body[field]);
    if (body[field] === "" || body[field] == null || !Number.isFinite(value) || value < min || value > max) {
      throw new ApiError(400, message);
    }
    data[field] = round(value);
  }
  const rates = body.overtimeRates ?? (body.overtimeMultiplier !== undefined ? Object.fromEntries(DAY_KEYS.map(day => [day, body.overtimeMultiplier])) : null);
  if (!rates || typeof rates != "object") throw new ApiError(400, "Enter the overtime rates");
  const overtimeRates = {};
  for (const day of DAY_KEYS) {
    const value = Number(rates[day]);
    if (rates[day] === "" || rates[day] == null || !Number.isFinite(value) || value < RATE_LIMITS[0] || value > RATE_LIMITS[1]) {
      throw new ApiError(400, `The ${day == "weekday" ? "weekday" : day} overtime rate must be between ${RATE_LIMITS[0]} and ${RATE_LIMITS[1]}`);
    }
    overtimeRates[day] = round(value);
  }
  if (body.leaveDaysPerYear !== undefined) {
    const leaveDays = Number(body.leaveDaysPerYear);
    if (body.leaveDaysPerYear === "" || body.leaveDaysPerYear == null || !Number.isFinite(leaveDays) || leaveDays < 0 || leaveDays > 366) {
      throw new ApiError(400, "Leave days per year must be between 0 and 366");
    }
  }
  if (body.leaveEnabled !== undefined && typeof body.leaveEnabled != "boolean") {
    throw new ApiError(400, "leaveEnabled must be true or false");
  }
  for (const [field, label] of [["saturdayDayValue", "A Saturday"], ["sundayDayValue", "A Sunday"]]) {
    if (body[field] === undefined) continue;
    const value = Number(body[field]);
    if (body[field] === "" || body[field] == null || !Number.isFinite(value) || value < DAY_VALUE_LIMITS[0] || value > DAY_VALUE_LIMITS[1]) {
      throw new ApiError(400, `${label} must count as ${DAY_VALUE_LIMITS[0]} to ${DAY_VALUE_LIMITS[1]} days`);
    }
  }
  if (body.overtimeRateSource !== undefined && !RATE_SOURCES.includes(body.overtimeRateSource)) {
    throw new ApiError(400, "Choose whether overtime uses the basic or the attendance bonus rate");
  }
  if (body.overtimeHoursBase !== undefined && !HOURS_BASES.includes(body.overtimeHoursBase)) {
    throw new ApiError(400, "Choose how the overtime hourly rate is worked out");
  }
  if (body.lockPeriods !== undefined && typeof body.lockPeriods != "boolean") {
    throw new ApiError(400, "lockPeriods must be true or false");
  }
  return serialize(await companyService.updateSettings({
    "payroll.standardHours.weekday": data.weekday,
    "payroll.standardHours.saturday": data.saturday,
    "payroll.standardHours.sunday": data.sunday,
    ...Object.fromEntries(DAY_KEYS.map(day => [`payroll.shifts.${day}`, shifts ? shifts[day] : shiftFromHours(data[day])])),
    "payroll.overtimeRates.weekday": overtimeRates.weekday,
    "payroll.overtimeRates.saturday": overtimeRates.saturday,
    "payroll.overtimeRates.sunday": overtimeRates.sunday,
    ...(body.saturdayDayValue !== undefined ? { "payroll.saturdayDayValue": round(Number(body.saturdayDayValue)) } : {}),
    ...(body.sundayDayValue !== undefined ? { "payroll.sundayDayValue": round(Number(body.sundayDayValue)) } : {}),
    ...(body.overtimeRateSource !== undefined ? { "payroll.overtimeRateSource": body.overtimeRateSource } : {}),
    ...(body.overtimeHoursBase !== undefined ? { "payroll.overtimeHoursBase": body.overtimeHoursBase } : {}),
    ...(typeof body.lockPeriods == "boolean" ? { "payroll.lockPeriods": body.lockPeriods } : {}),
    ...(typeof body.leaveEnabled == "boolean" ? { "payroll.leaveEnabled": body.leaveEnabled } : {}),
    ...(body.leaveDaysPerYear !== undefined ? { "payroll.leaveDaysPerYear": round(Number(body.leaveDaysPerYear)) } : {})
  }, userId));
}
