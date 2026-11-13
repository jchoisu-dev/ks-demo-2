const mongoose = require("mongoose");
const PayrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    index: true
  },

  period: {
    month: String,
  },

  baseSalary: Number,
  overtimePay: Number,
  bonus: Number,
  deductions: Number,

  gross: Number,
  net: Number,

  currency: String,

  status: {
    type: String,
    enum: ["pending", "approved", "paid"],
    default: "pending"
  }
}, { timestamps: true });

module.exports = PayrollSchema;