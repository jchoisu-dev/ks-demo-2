const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["employee", "manager"],
      required: true,
    },

    scopeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    month: {
      type: String,
      required: true,
      index: true,
    },

    data: {
      type: Object,
      required: true,
    },

    totals: {
      totalHours: Number,
      totalMinutes: Number,
      totalPay: Number,
      currency: String,
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    fileUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = ReportSchema;