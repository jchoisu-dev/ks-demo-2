const LOG = require("./log.model");
const mongoose = require("mongoose");
exports.create = async (data) => {
  return await LOG.create(data);
}
exports.merge = async (id, { before, after }, label) => {
  const set = {};
  if (label) set.label = label;
  for (const [field, value] of Object.entries(before || {})) set[`changes.before.${field}`] = value;
  for (const [field, value] of Object.entries(after || {})) set[`changes.after.${field}`] = value;
  if (Object.keys(set).length) await LOG.updateOne({ _id: id }, { $set: set });
}
exports.findAll = async ({ filter, skip, limit }) => {
  const [data, count] = await Promise.all([
    LOG.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    LOG.countDocuments(filter)
  ]);
  return { data, count };
}
exports.findUserName = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) return "";
  const user = await mongoose.model("User").findById(userId, { firstName: 1, lastName: 1 }).lean();
  return user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
}
exports.findEmployeeByUserId = async (userId) => {
  return await mongoose.model("Employee").findOne({ userId }, { _id: 1 }).lean();
}
exports.findEmployeeName = async (employeeId) => {
  if (!mongoose.isValidObjectId(employeeId)) return "";
  const employee = await mongoose.model("Employee").findById(employeeId, { userId: 1 }).lean();
  return employee ? await exports.findUserName(employee.userId) : "";
}

