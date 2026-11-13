const mongoose = require("mongoose");
const BracketSchema = new mongoose.Schema(
  {
    upTo: {
      type: Number,
      default: null,
      min: 0
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  {
    _id: false
  }
);
const HealthBandSchema = new mongoose.Schema(
  {
    fromAge: {
      type: Number,
      required: true,
      min: 0
    },
    toAge: {
      type: Number,
      default: null,
      min: 0
    },
    monthly: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: false
  }
);
const TaxSchema = new mongoose.Schema(
  {
    effectiveFrom: {
      type: Date,
      required: [true, "Effective date is required"],
      unique: true,
      index: true
    },

    reference: {
      type: String,
      default: "",
      trim: true
    },

    notes: {
      type: String,
      default: ""
    },

    wageTax: {
      taxFreeAllowance: { type: Number, required: true, min: 0 },
      deductibleCostsRate: { type: Number, required: true, min: 0, max: 100 },
      deductibleCostsMax: { type: Number, required: true, min: 0 },
      taxCredit: { type: Number, default: 0, min: 0 },
      medicalAddition: { type: Number, default: 0, min: 0 },
      brackets: { type: [BracketSchema], default: [] }
    },

    overtimeTax: {
      brackets: { type: [BracketSchema], default: [] }
    },

    specialPayments: {
      brackets: { type: [BracketSchema], default: [] }
    },

    exemptions: {
      holidayAllowance: { type: Number, default: 0, min: 0 },
      bonus: { type: Number, default: 0, min: 0 },
      childAllowancePerChild: { type: Number, default: 0, min: 0 },
      childAllowanceMax: { type: Number, default: 0, min: 0 }
    },

    aov: {
      rate: { type: Number, required: true, min: 0, max: 100 },
      maxAge: { type: Number, default: 60, min: 0 }
    },

    pension: {
      rate: { type: Number, default: 0, min: 0, max: 100 },
      employerShare: { type: Number, default: 50, min: 0, max: 100 }
    },

    healthInsurance: {
      employerShare: { type: Number, default: 50, min: 0, max: 100 },
      bands: { type: [HealthBandSchema], default: [] }
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);
TaxSchema.plugin(require("../plugins/activityLog.plugin"), { entity: "tax" });
module.exports = TaxSchema;
