const mongoose = require("mongoose");

const AdjustmentSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },
        date: {
            type: Date,
            required: true
        },

        type: {
            type: String,
            enum: ["bonus", "deduction"],
            required: true
        },
        scope: {
            type: String,
            enum: ["date", "month"],
            default: "date"
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        currency: {
            type: String,
            enum: ["SRD", "USD", "EUR"]
        },
        originalAmount: {
            type: Number,
            min: 0
        },
        exchangeRate: {
            type: Number,
            min: 0
        },
        reason: {
            type: String
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
AdjustmentSchema.plugin(require("../plugins/activityLog.plugin"), { entity: "adjustment" });
module.exports = AdjustmentSchema;