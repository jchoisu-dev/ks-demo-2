const dayjs = require('dayjs');
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const getStartEndOfMonth = async (day) => {
  const now = day ? dayjs.utc(day) : dayjs.utc();
  const beginDay = now.startOf("month").toDate();
  const endDay = now.endOf("month").toDate();
  return {
    beginDay,
    endDay
  };
};
const minutesToHours = async (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}
const timeToMinutes = async (time) => {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
const dayTypeOf = (date) => {
  const day = dayjs.utc(date).day();
  if (day === 0) return "SUNDAY";
  if (day === 6) return "SATURDAY";
  return "WORKDAY";
};
const getDayType = async (date) => dayTypeOf(date);
const STANDARD_HOURS_KEY = {
  WORKDAY: "weekday",
  SATURDAY: "saturday",
  SUNDAY: "sunday"
};
const overtimeRateFor = (workHours, dayType) => {
  const key = STANDARD_HOURS_KEY[dayType];
  return workHours?.overtimeRates?.[key] ?? workHours?.overtimeMultiplier ?? 1.5;
};
const summarizeWorkdays = (attendances, standardHours) => {
  const days = {};
  for (const attendance of attendances) {
    const date = dayjs.utc(attendance.date).format("YYYY-MM-DD");
    const day = days[date] ||= {
      date,
      dayType: dayTypeOf(attendance.date),
      hasPresent: false,
      presentMinutes: 0,
      overtimeEntryMinutes: 0
    };
    if (attendance.type == "present") {
      day.hasPresent = true;
      day.presentMinutes += attendance.totalWorkedMinutes || 0;
    }
    if (attendance.type == "overtime") {
      day.overtimeEntryMinutes += attendance.totalWorkedMinutes || 0;
    }
  }
  for (const day of Object.values(days)) {
    day.standardMinutes = Math.round((standardHours?.[STANDARD_HOURS_KEY[day.dayType]] ?? 8) * 60);
    day.regularMinutes = Math.min(day.presentMinutes, day.standardMinutes);
    day.extraMinutes = Math.max(0, day.presentMinutes - day.standardMinutes);
    day.overtimeMinutes = day.extraMinutes + day.overtimeEntryMinutes;
    day.overtimeRate = overtimeRateFor(standardHours, day.dayType);
    day.baseHours = standardHours?.overtimeOnWeekdayHours === true || day.standardMinutes <= 0
      ? (standardHours?.weekday || 8)
      : day.standardMinutes / 60;
    day.isWorkday = day.hasPresent && day.standardMinutes > 0;
  }
  return days;
};
const mTh = async (minutes) => {
  return minutes / 60;
};
const getWorkdaysMonth = async (beginDay, endDay, { saturday = true } = {}) => {
  const start = beginDay ? dayjs.utc(beginDay).startOf("day") : dayjs.utc().startOf("month");
  const end = endDay ? dayjs.utc(endDay).startOf("day") : dayjs.utc().endOf("month").startOf("day");

  let count = 0;
  for (
    let date = start;
    date.isBefore(end) || date.isSame(end, "day");
    date = date.add(1, "day")
  ) {
    const day = date.day();
    if ((day >= 1 && day <= 5) || (day == 6 && saturday)) {
      count++;
    }
  }
  return count;
};
module.exports = {
  getStartEndOfMonth,
  minutesToHours,
  timeToMinutes,
  getDayType,
  summarizeWorkdays,
  overtimeRateFor,
  mTh,
  getWorkdaysMonth
}