const USER = require("./user.model");
const { STAFF_ROLES } = require('@/shared/constants');
const FIELDS = { firstName: 1, lastName: 1, email: 1, phone: 1, role: 1, active: 1, lastLoginAt: 1, mustChangePassword: 1, createdAt: 1 };
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
exports.findStaff = async ({ q, skip, limit }) => {
  const filter = { deleted: false, role: { $in: STAFF_ROLES } };
  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ firstName: pattern }, { lastName: pattern }, { email: pattern }];
  }
  const [data, count] = await Promise.all([
    USER.find(filter, FIELDS).sort({ firstName: 1, lastName: 1, _id: 1 }).skip(skip).limit(limit).lean(),
    USER.countDocuments(filter)
  ]);
  return { data, count };
}
exports.findStaffById = async (id) => {
  return await USER.findOne({ _id: id, deleted: false, role: { $in: STAFF_ROLES } }, FIELDS).lean();
}
exports.findByEmail = async (email) => {
  return await USER.findOne({ email, deleted: false }, { _id: 1 }).lean();
}
exports.countActiveAdmins = async () => {
  return await USER.countDocuments({ role: "admin", active: true, deleted: false });
}
exports.findAll = async (data) => {
  return await USER.find().sort({ createdAt: -1 });
}
exports.findById = async (id) => {
  return await USER.findById(id);
}
exports.create = async (data) => {
  return await USER.create(data);
}
exports.update = async (id, data) => {
  return await USER.findByIdAndUpdate(id, data, { new: true });
}
exports.updateStaff = async (id, data) => {
  return await USER.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).select(FIELDS).lean();
}
exports.delete = async (id) => {
  return await USER.findByIdAndDelete(id);
}
