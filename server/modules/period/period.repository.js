const PERIOD = require("./period.model");
const EMPLOYEE = require("../employee/employee.model");
exports.findAll = async () => {
  return await PERIOD.find({ deleted: false }, { employees: 0, settings: 0 }).sort({ beginDay: -1 }).lean();
}
exports.findById = async (id) => {
  return await PERIOD.findOne({ _id: id, deleted: false }).lean();
}
exports.findExact = async ({ beginDay, endDay }) => {
  return await PERIOD.findOne({ beginDay, endDay, deleted: false }).lean();
}
exports.findOverlapping = async ({ beginDay, endDay }) => {
  return await PERIOD.findOne({ deleted: false, beginDay: { $lte: endDay }, endDay: { $gte: beginDay } }, { employees: 0, settings: 0 }).lean();
}
exports.findContaining = async (date) => {
  return await PERIOD.findOne({ deleted: false, beginDay: { $lte: date }, endDay: { $gte: date } }, { employees: 0, settings: 0 }).lean();
}
exports.findEmployeesForSnapshot = async () => {
  return await EMPLOYEE.find({ deleted: false }, { salary: 1, incentive_weekdays: 1, birthdate: 1, hiredAt: 1, endWorkDay: 1 }).lean();
}
exports.create = async (data) => {
  const period = await PERIOD.create(data);
  return period.toObject();
}
exports.reopen = async (id) => {
  return await PERIOD.findOneAndUpdate({ _id: id, deleted: false }, { $set: { deleted: true } }, { new: true }).lean();
}
