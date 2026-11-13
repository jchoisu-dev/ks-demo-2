const { CONSTANT_UTC_OFFSET_MINUTES } = require('@/shared/constants');
const { dayjs } = require('../../shared/utils');
const holidayRepos = require("./holiday.repository");
const { ApiError } = require('../../shared/utils');
exports.getHolidays = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const { holidays, count: totalRecords } = await holidayRepos.findAll({ ...query, limit, skip });
  const list = [];
  for (const s in holidays) {
    const holiday = holidays[s];
    list.push({
      id: holiday._id,
      name: holiday.name,
      date: dayjs.utc(holiday.date).format('YYYY-MM-DD'),
      type: holiday.type.toUpperCase(),
      rate: holiday.rate,
      createdAt: dayjs.utc(holiday.createdAt).utcOffset(CONSTANT_UTC_OFFSET_MINUTES).format('YYYY-MM-DD')
    })
  }
  return {
    data: list,
    meta: {
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      hasNextPage: page * limit < totalRecords,
      hasPreviousPage: page > 1
    }
  };
}
exports.getHolidayById = async (id) => {
  const holiday = await holidayRepos.findById(id);
  if (!holiday) throw new ApiError(404, "Holiday not found");
  return {
    ...holiday,
    date: dayjs.utc(holiday.date).format('YYYY-MM-DD'),
    paid: holiday.paid ? "Yes" : "No",
  };
}
exports.createHoliday = async (data) => {
  const { name, date } = data;
  const result = await holidayRepos.find({
    name,
    date
  });
  if (!result) {
    throw new ApiError(404, "Holiday already exists");
  }
  const holiday = await holidayRepos.createHoliday(data);
  return holiday;
};
exports.updateHoliday = async (id, data) => {
  const updated = await holidayRepos.update(id, data);
  if (!updated) throw new ApiError(404, "Holiday not found");
  return updated;
}
exports.deleteHoliday = async (id) => {
  const deleted = await holidayRepos.delete(id);
  if (!deleted) throw new ApiError(404, "Holiday not found");
  return deleted;
}