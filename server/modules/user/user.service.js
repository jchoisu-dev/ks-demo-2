const mongoose = require("mongoose");
const userRepo = require("./user.repository");
const { ApiError } = require('../../shared/utils');
const { hashPassword } = require('../../shared/utils/password');
const { STAFF_ROLES, ROLE_ADMIN, ROLE_PAYROLL, ROLE_VIEWER } = require('@/shared/constants');
const { validatePassword } = require('../auth/auth.service');
const ASSIGNABLE_ROLES = [ROLE_ADMIN, ROLE_PAYROLL, ROLE_VIEWER];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const serialize = (user) => ({
  id: String(user._id),
  firstName: user.firstName || "",
  lastName: user.lastName || "",
  email: user.email || "",
  phone: user.phone || "",
  role: user.role,
  active: user.active !== false,
  mustChangePassword: Boolean(user.mustChangePassword),
  lastLoginAt: user.lastLoginAt || null,
  createdAt: user.createdAt || null
});
const findStaffOrFail = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "User not found");
  const user = await userRepo.findStaffById(id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
}
const cleanProfile = async (body, currentId = null) => {
  const data = {};
  for (const field of ["firstName", "lastName", "phone"]) {
    if (body[field] !== undefined) data[field] = String(body[field] ?? "").trim();
  }
  if (body.firstName !== undefined && !data.firstName) throw new ApiError(400, "First name is required");
  if (body.email !== undefined) {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!EMAIL.test(email)) throw new ApiError(400, "Enter a valid email address");
    const existing = await userRepo.findByEmail(email);
    if (existing && String(existing._id) != String(currentId)) throw new ApiError(409, "Another user already uses this email address");
    data.email = email;
  }
  if (body.role !== undefined) {
    if (!ASSIGNABLE_ROLES.includes(body.role)) throw new ApiError(400, "Choose a valid role");
    data.role = body.role;
  }
  if (body.active !== undefined) data.active = Boolean(body.active);
  return data;
}
const ensureAdminRemains = async (user, changes) => {
  const losesAdmin = user.role == ROLE_ADMIN && user.active !== false && (
    (changes.role !== undefined && changes.role != ROLE_ADMIN) ||
    changes.active === false ||
    changes.deleted === true
  );
  if (losesAdmin && await userRepo.countActiveAdmins() <= 1) {
    throw new ApiError(400, "At least one active admin is required");
  }
}
const PAGE_LIMIT = 10;
exports.getStaff = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const q = String(query.q || "").trim();
  const { data, count } = await userRepo.findStaff({ q, skip: (page - 1) * PAGE_LIMIT, limit: PAGE_LIMIT });
  return {
    data: data.map(serialize),
    meta: {
      page,
      limit: PAGE_LIMIT,
      totalRecords: count,
      totalPages: Math.ceil(count / PAGE_LIMIT),
      hasNextPage: page * PAGE_LIMIT < count,
      hasPreviousPage: page > 1
    }
  };
}
exports.createStaff = async (body = {}) => {
  const data = await cleanProfile({ ...body, email: body.email ?? "", firstName: body.firstName ?? "", role: body.role ?? "" });
  validatePassword(body.password);
  const user = await userRepo.create({ ...data, password: body.password, active: true, mustChangePassword: true });
  return serialize(user.toObject());
}
exports.updateStaff = async (id, body = {}, currentUserId) => {
  const user = await findStaffOrFail(id);
  const data = await cleanProfile(body, id);
  if (String(id) == String(currentUserId) && (data.active === false || (data.role !== undefined && data.role != user.role))) {
    throw new ApiError(400, "You cannot change your own role or deactivate yourself");
  }
  await ensureAdminRemains(user, data);
  return serialize(await userRepo.updateStaff(id, data));
}
exports.resetPassword = async (id, body = {}) => {
  await findStaffOrFail(id);
  validatePassword(body.password);
  return serialize(await userRepo.updateStaff(id, { password: await hashPassword(body.password), mustChangePassword: true }));
}
exports.deleteStaff = async (id, currentUserId) => {
  const user = await findStaffOrFail(id);
  if (String(id) == String(currentUserId)) throw new ApiError(400, "You cannot delete your own account");
  await ensureAdminRemains(user, { deleted: true });
  await userRepo.updateStaff(id, { deleted: true, active: false });
  return { id: String(id) };
}
exports.STAFF_ROLES = STAFF_ROLES;
exports.getAllusers = async () => {
  return userRepo.findAll();
}
exports.getuserById = async (id) => {
  const user = await userRepo.findById(id);
  if (!user) throw new Error("user not found");
  return user;
}
exports.createUser = async (data) => {
  return userRepo.create(data);
}
exports.updateUser = async (id, data) => {
  const updated = await userRepo.update(id, data);
  if (!updated) throw new Error("user not found");
  return updated;
}
exports.deleteUser = async (id) => {
  const deleted = await userRepo.delete(id);
  if (!deleted) throw new Error("user not found");
  return deleted;
}
