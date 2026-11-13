const mongoose = require("mongoose");
const HolidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    date: {
      type: Date,
      required: true,
      index: true
    },
    
    type: {
      type: String,
      enum: [
        "national",
        "company",
        "religious"
      ],
      default: "national"
    },

    rate: {
      type: Number,
      default: 0
    },

    paid: {
      type: Boolean,
      default: true
    },

    active: {
      type: Boolean,
      default: true
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

HolidaySchema.index(
  {
    name: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

HolidaySchema.plugin(require("../plugins/activityLog.plugin"), { entity: "holiday" });
module.exports = HolidaySchema;