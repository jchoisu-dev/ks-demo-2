const mongoose = require("mongoose");
const PayslipSignatureSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },

    beginDay: {
      type: Date,
      required: true
    },

    endDay: {
      type: Date,
      required: true
    },

    signature: {
      type: String,
      required: true
    },

    signedAt: {
      type: Date,
      default: Date.now
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);
PayslipSignatureSchema.index({ employeeId: 1, beginDay: 1, endDay: 1 }, { unique: true });
PayslipSignatureSchema.plugin(require("../plugins/activityLog.plugin"), { entity: "payslip" });
module.exports = PayslipSignatureSchema;
