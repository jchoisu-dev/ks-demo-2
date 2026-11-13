const USER = require("./auth.model");
const PROFILE = {
  firstName: 1,
  lastName: 1,
  email: 1,
  role: 1,
  profileImage: 1,
  active: 1,
  mustChangePassword: 1
};
exports.findForLogin = async (email, roles) => {
  return await USER
    .findOne({ email, role: { $in: roles }, deleted: false })
    .select({ ...PROFILE, password: 1 })
    .lean();
};
exports.findByUser = async(data) => {
  const user = await USER
    .findOne({
      ...data,
      deleted: false
    })
    .select(PROFILE)
    .lean()
  ;
  return user;
};
exports.findProfile = async (id) => {
  return await USER.findOne({ _id: id, deleted: false }).select(PROFILE).lean();
};
exports.findPassword = async (id) => {
  return await USER.findOne({ _id: id, deleted: false }, { password: 1 }).lean();
};
exports.update = async (id, data) => {
  return await USER.findByIdAndUpdate(id, { $set: data }, { new: true }).select(PROFILE).lean();
};
exports.create = async(data) => {
  return await USER.create(data);
};

