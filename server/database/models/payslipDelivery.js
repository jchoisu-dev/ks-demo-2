const mongoose = require("mongoose");
const PayslipDeliverySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true
    },

    beginDay: {
      type: Date,
      required: true
    },

    endDay: {
      type: Date,
      required: true
    },

    channel: {
      type: String,
      enum: ["email"],
      default: "email"
    },

    to: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true
    },

    error: {
      type: String,
      default: ""
    },

    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);
PayslipDeliverySchema.index({ employeeId: 1, beginDay: 1, endDay: 1, createdAt: -1 });
PayslipDeliverySchema.plugin(require("../plugins/activityLog.plugin"), { entity: "delivery" });
module.exports = PayslipDeliverySchema;
