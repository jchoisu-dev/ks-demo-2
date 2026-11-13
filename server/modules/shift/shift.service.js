const { CONSTANT_UTC_OFFSET_MINUTES } = require('@/shared/constants');
const { dayjs } = require('../../shared/utils');
const shiftRepos = require("./shift.repository");
const { ApiError, minutesToHours } = require('../../shared/utils');
exports.getShifts = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const { shifts, count: totalRecords } = await shiftRepos.findAll({ ...query, limit, skip });
  const list = [];
  for(const s in shifts){
    const shift = shifts[s];
    list.push({
      id: shift._id,
      name: shift.name,
      begin: shift.begin,
      end: shift.end,
      break: shift.break,
      type: shift.type || "work",
      createdAt: dayjs.utc(shift.createdAt).utcOffset(CONSTANT_UTC_OFFSET_MINUTES).format('YYYY-MM-DD')
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
exports.getShiftById = async(id) => {
  const shift = await shiftRepos.findById(id);
  if (!shift) throw new ApiError(404, "Shift not found");
  return shift;
}
const SHIFT_TYPES = ["work", "overtime"];
const assertType = (data) => {
  if (data?.type !== undefined && !SHIFT_TYPES.includes(data.type)) throw new ApiError(400, "Choose normal or overtime");
};
exports.createShift = async (data) => {
  assertType(data);
  const shift = await shiftRepos.createShift(data);
  return shift;
};
exports.updateShift = async (id, data) => {
  assertType(data);
  const updated = await shiftRepos.update(id, data);
  if (!updated) throw new ApiError(404, "Shift not found");
  return updated;
}
exports.deleteShift = async (id) => {
  const deleted = await shiftRepos.delete(id);
  if (!deleted) throw new ApiError(404, "Shift not found");
  return deleted;
}

exports.getAllShifts = async (query) => {
  const results = await shiftRepos.findAllShifts();
  const shifts = [];
  for(const i in results){
    const shift = results[i];
    shifts.push({ 
      id: shift._id,
      name: shift.name,
      shift: shift.begin + ' - ' + shift.end,
      totalShiftMinutes: await minutesToHours(shift.totalShiftMinutes),
      break: await minutesToHours(shift.break),
      type: shift.type || "work"
    })
  }
  return shifts;
}