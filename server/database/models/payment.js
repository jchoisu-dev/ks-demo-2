const mongoose = require("mongoose");
const PaymentSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    index: true
  },

  payrollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payroll"
  },

  amount: Number,

  currency: String,

  method: {
    type: String,
    enum: ["bank", "cash", "crypto", "mobile"]
  },

  type: {
    type: String,
    enum: ["salary", "bonus", "adjustment"]
  },

  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  },

  reference: String,

  paidAt: Date,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = PaymentSchema;