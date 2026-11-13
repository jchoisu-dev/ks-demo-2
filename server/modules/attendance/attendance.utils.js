const dayjs = require('dayjs');
const weekOfYear = require("dayjs/plugin/weekOfYear");
const isoWeek = require("dayjs/plugin/isoWeek");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
exports.getStartEndOfWeek = async (calendarWeek) => {
  const now = calendarWeek ? dayjs.utc(calendarWeek) : dayjs.utc();

  const dayOfWeek = now.day();

  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const startOfWeek = now
    .subtract(daysFromMonday, "day")
    .startOf("day");

  const endOfWeek = startOfWeek
    .add(6, "day")
    .endOf("day");

  const currentWeekState = {
    year: now.year(),
    month: now.format("MMMM"),
    week: now.isoWeek()
  };
  return {
    startOfWeek,
    endOfWeek,
    currentWeekState
  };
};
exports.getWeekDays = async (startOfWeek) => {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = dayjs.utc(startOfWeek).add(index, "day");

    return {
      key: date.format("YYYY-MM-DD"),
      label: date.format("ddd DD")
    };
  });
};