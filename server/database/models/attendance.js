const mongoose = require("mongoose");
const { timeToMinutes } = require('@/shared/utils');
const AttendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },

    name: {
      type: String
    },

    date: {
      type: Date,
      required: true
    },

    begin: {
      type: String,
      default: ""
    },

    end: {
      type: String,
      default: ""
    },

    totalWorkedMinutes: {
      type: Number,
      default: 0
    },

    totalBreakMinutes: {
      type: Number,
      default: 0
    },
    
    billable: {
      type: Boolean,
      default: true
    },

    notes: {
      type: String,
      default: ""
    },

    type: {
      type: String,
      required: true,
      enum: [
        "present",
        "overtime",
        "absent",
        "leave",
        "holiday",
        "sick"
      ],
      default: "present"
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

AttendanceSchema.pre("save", async function (next) {
  if (this.begin && this.end) {
    const beginMinutes = await timeToMinutes(this.begin);
    const endMinutes = await timeToMinutes(this.end);

    let workedMinutes =
      endMinutes -
      beginMinutes -
      (this.totalBreakMinutes || 0);

    if (workedMinutes < 0) {
      workedMinutes += 1440;
    }

    this.totalWorkedMinutes = workedMinutes;
  }

  next();
});
AttendanceSchema.plugin(require("../plugins/activityLog.plugin"), { entity: "attendance" });
module.exports = AttendanceSchema;