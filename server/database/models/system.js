const mongoose = require("mongoose");
const SystemSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    category: {
      type: String,
      enum: [
        "attendance",
        "payroll",
        "holiday",
        "leave",
        "general",
      ],
      default: "general"
    },

    editable: {
      type: Boolean,
      default: true
    },

    deleted: {
      type: Boolean,
      default: false
    },

  },
  {
    timestamps: true
  }
);

module.exports = SystemSchema;