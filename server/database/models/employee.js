const mongoose = require("mongoose");
const EmployeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    description: {
      type: String,
      default: ""
    },

    position: {
      type: String,
      default: ""
    },

    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "freelancer"],
      default: "full-time"
    },

    birthdate: Date,

    hiredAt: Date,

    startWorkDay: Date,

    endWorkDay: Date,

    salary: {
      amount: {
        type: Number,
        required: true,
        default: 0
      },
      currency: {
        type: String,
        default: "SRD",
        enum: ["USD", "EUR", "SRD"]
      },
      payType: {
        type: String,
        enum: ["hourly", "daily", "weekly", "monthly"],
        default: "monthly"
      }
    },

    incentive_weekdays: {
      amount: {
        type: Number,
        default: 0
      },
      currency: {
        type: String,
        default: "SRD",
        enum: ["USD", "EUR", "SRD"]
      }
    },

    incentive_weekends: {
      amount: {
        type: Number,
        default: 0
      },
      currency: {
        type: String,
        default: "SRD",
        enum: ["USD", "EUR", "SRD"]
      }
    },

    leaveDaysPerYear: {
      type: Number,
      default: null,
      min: [0, "Leave days cannot be negative"],
      max: [366, "Leave days must be at most 366"]
    },

    bank: {
      name: {
        type: String,
        trim: true,
        default: ""
      },
      accountNumber: {
        type: String,
        trim: true,
        default: ""
      },
      accountHolder: {
        type: String,
        trim: true,
        default: ""
      }
    },

    status: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
      index: true,
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

EmployeeSchema.plugin(require("../plugins/activityLog.plugin"), { entity: "employee" });
module.exports = EmployeeSchema;