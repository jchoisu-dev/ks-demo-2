const mongoose = require("mongoose");
const PayoutLineSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    payAmount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, enum: ["SRD", "USD", "EUR"], required: true },
    amount: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["cash", "bank", "other"], default: "cash" },
    note: { type: String, default: "", trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);
const PayoutSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    beginDay: { type: Date, required: true },
    endDay: { type: Date, required: true },
    payCurrency: { type: String, enum: ["SRD", "USD", "EUR"], required: true },
    lines: { type: [PayoutLineSchema], default: [] },
    deleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);
PayoutSchema.index({ employeeId: 1, beginDay: 1, endDay: 1 }, { unique: true });
PayoutSchema.plugin(require("../plugins/activityLog.plugin"), { entity: "payout" });
module.exports = PayoutSchema;
