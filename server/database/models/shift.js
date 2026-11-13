const mongoose = require("mongoose");
const { timeToMinutes } = require('@/shared/utils');
const ShiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    begin: {
      type: String,
      required: true
    },

    end: {
      type: String,
      required: true
    },

    break: {
      type: Number,
      default: 0
    },

    totalShiftMinutes: {
      type: Number,
      default: 0
    },

    type: {
      type: String,
      enum: ["work", "overtime"],
      default: "work",
      required: true
    },

    description: {
      type: String,
      default: ""
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

ShiftSchema.pre("save", async function (next) {
  if (this?.begin && this?.end) {
    let totalShiftMinutes = await timeToMinutes(this.end) - await timeToMinutes(this.begin);

    if (totalShiftMinutes < 0) {
      totalShiftMinutes += 1440;
    }

    this.totalShiftMinutes = totalShiftMinutes - this.break;
  }

  next();
});

ShiftSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  if (update?.begin && update?.end) {
    let totalShiftMinutes = await timeToMinutes(update.end) - await timeToMinutes(update.begin);

    if (totalShiftMinutes < 0) {
      totalShiftMinutes += 1440;
    }
    update.$set.totalShiftMinutes = totalShiftMinutes - update.break;
  }

  next();
});

ShiftSchema.plugin(require("../plugins/activityLog.plugin"), { entity: "shift" });
module.exports = ShiftSchema;