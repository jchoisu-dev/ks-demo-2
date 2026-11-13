const mongoose = require("mongoose");
const PeriodEmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    salary: mongoose.Schema.Types.Mixed,
    incentive_monthly: mongoose.Schema.Types.Mixed,
    incentive_weekdays: mongoose.Schema.Types.Mixed,
    birthdate: Date,
    hiredAt: Date,
    endWorkDay: Date
  },
  {
    _id: false
  }
);
const PayrollPeriodSchema = new mongoose.Schema(
  {
    beginDay: {
      type: Date,
      required: true,
      index: true
    },

    endDay: {
      type: Date,
      required: true,
      index: true
    },

    closedAt: {
      type: Date,
      default: Date.now
    },

    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    settings: {
      workHours: mongoose.Schema.Types.Mixed,
      applyTax: Boolean,
      tax: mongoose.Schema.Types.Mixed
    },

    employees: {
      type: [PeriodEmployeeSchema],
      default: []
    },

    deleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);
PayrollPeriodSchema.plugin(require("../plugins/activityLog.plugin"), { entity: "period" });
module.exports = PayrollPeriodSchema;
