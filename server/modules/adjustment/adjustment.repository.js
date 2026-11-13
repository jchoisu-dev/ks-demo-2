const ADJUSTMENT = require("./adjustment.model");
exports.findAll = async ({employeeId, beginDay, endDay }) => {
  const adjustments = await ADJUSTMENT.find({
    employeeId,
    deleted: false,
    date: {
      $gte: beginDay,
      $lt: endDay,
    }
  })
  return adjustments;
}
exports.findEmployee = async (id) => {
  return await require("../employee/employee.model").findById(id, { userId: 1, salary: 1 }).populate({ path: "userId", select: { firstName: 1, lastName: 1 } }).lean().catch(() => null);
}
exports.createAdjustment= async (data) => {
  return await ADJUSTMENT.create(data);
}
exports.findDate = async (id) => {
  return await ADJUSTMENT.findOne({ _id: id, deleted: false }, { date: 1 }).lean().catch(() => null);
}
exports.delete = async (id) => {
  const adjustment = await ADJUSTMENT.findByIdAndUpdate(id, { deleted: true });
  return adjustment;
}