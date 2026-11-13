const authRepo = require("./auth.repository");
const jwt = require("jsonwebtoken");
const { ApiError } = require('../../shared/utils');
const { hashPassword, verifyPassword, rejectWithDelay } = require('../../shared/utils/password');
const { STAFF_ROLES } = require('@/shared/constants');
const MIN_PASSWORD_LENGTH = 8;
const TOKEN_LIFETIME = process.env.JWT_EXPIRES_IN || "7d";
const toProfile = ({ _id, password, ...user }) => user;
exports.MIN_PASSWORD_LENGTH = MIN_PASSWORD_LENGTH;
exports.validatePassword = (password) => {
    if (typeof password != "string" || password.length < MIN_PASSWORD_LENGTH) {
        throw new ApiError(400, `The password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
};
exports.login = async ({ email, password }) => {
    if (!email || !password) throw new ApiError(400, "Email and password are required.");
    const user = await authRepo.findForLogin(String(email).trim().toLowerCase(), STAFF_ROLES);
    if (!user) {
        await rejectWithDelay(password);
        throw new ApiError(403, "Invalid username or password.");
    };
    const valid = await verifyPassword(String(password), user.password);
    if (!valid) {
        throw new ApiError(403, "Invalid username or password.");
    };
    if (!user.active) {
        throw new ApiError(403, "Your account is inactive.");
    };
    const userId = user._id;
    await authRepo.update(userId, { lastLoginAt: new Date() });
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_LIFETIME });
    return {
        ...toProfile(user),
        token
    };
};
exports.me = async (userId) => {
    const user = await authRepo.findProfile(userId);
    if (!user) throw new ApiError(401, "Your session has ended. Please log in again.");
    return toProfile(user);
};
exports.changePassword = async (userId, { currentPassword, newPassword } = {}) => {
    const user = await authRepo.findPassword(userId);
    if (!user) throw new ApiError(401, "Your session has ended. Please log in again.");
    if (!currentPassword || !(await verifyPassword(String(currentPassword), user.password))) {
        throw new ApiError(400, "The current password is not correct");
    }
    exports.validatePassword(newPassword);
    if (newPassword == currentPassword) throw new ApiError(400, "Choose a password that is different from the current one");
    const updated = await authRepo.update(userId, { password: await hashPassword(newPassword), mustChangePassword: false });
    return toProfile(updated);
};
