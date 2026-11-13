const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const requestContext = require("../utils/requestContext");
const { STAFF_ROLES } = require("../constants");
const SESSION_ENDED = "Your session has ended. Please log in again.";
const build = (roles) => async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      message: "Authorization token is missing"
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Invalid token format"
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }

  if (!mongoose.isValidObjectId(decoded.id)) {
    return res.status(401).json({ message: SESSION_ENDED });
  }

  let user;
  try {
    user = await mongoose.model("User")
      .findById(decoded.id, { firstName: 1, lastName: 1, role: 1, active: 1, deleted: 1 })
      .lean();
  } catch (error) {
    return next(error);
  }

  if (!user || user.deleted || !user.active || !roles.includes(user.role)) {
    return res.status(401).json({ message: SESSION_ENDED });
  }

  const userName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  req.user = {
    userId: String(user._id),
    role: user.role,
    name: userName
  };

  requestContext.run({ userId: String(user._id), userName }, next);
}
const authenticate = build(STAFF_ROLES);
module.exports = authenticate
