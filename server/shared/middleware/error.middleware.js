const mongoose = require("mongoose");
const toResponse = (error) => {
  if (error?.isOperational) return { statusCode: error.statusCode || 500, message: error.message };
  if (error instanceof mongoose.Error.ValidationError) {
    const [first] = Object.values(error.errors);
    return { statusCode: 400, message: first?.message || "Invalid data" };
  }
  if (error instanceof mongoose.Error.CastError) return { statusCode: 400, message: `Invalid ${error.path}` };
  if (error?.type == "entity.parse.failed") return { statusCode: 400, message: "Invalid JSON body" };
  if (error?.type == "entity.too.large") return { statusCode: 413, message: "The request is too large" };
  return { statusCode: 500, message: "Internal Server Error" };
};
const errorHandler = (error, req, res, next) => {
  const { statusCode, message } = toResponse(error);
  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, error);
  }
  if (res.headersSent) return res.end();
  res.status(statusCode).json({
    success: false,
    message
  });
};
module.exports = errorHandler;
