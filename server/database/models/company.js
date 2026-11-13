const mongoose = require("mongoose");
const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const optionalMatch = (regex, message) => ({
  validator: (value) => !value || regex.test(value),
  message
});
const ContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Contact name is required"],
      trim: true
    },

    role: {
      type: String,
      default: "",
      trim: true
    },

    phone: {
      type: String,
      default: "",
      trim: true
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
      validate: optionalMatch(EMAIL_FORMAT, "Contact email is invalid")
    }
  },
  {
    _id: false
  }
);
const OpeningHourSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: WEEKDAYS,
      required: true
    },

    open: {
      type: Boolean,
      default: false
    },

    begin: {
      type: String,
      default: "",
      validate: optionalMatch(TIME_FORMAT, "Opening time must be HH:mm")
    },

    end: {
      type: String,
      default: "",
      validate: optionalMatch(TIME_FORMAT, "Closing time must be HH:mm")
    }
  },
  {
    _id: false
  }
);
const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true
    },

    legalName: {
      type: String,
      default: "",
      trim: true
    },

    registrationNumber: {
      type: String,
      default: "",
      trim: true
    },

    taxNumber: {
      type: String,
      default: "",
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
      validate: optionalMatch(EMAIL_FORMAT, "Company email is invalid")
    },

    phone: {
      type: String,
      default: "",
      trim: true
    },

    website: {
      type: String,
      default: "",
      trim: true
    },

    logoUrl: {
      type: String,
      default: "",
      trim: true
    },

    address: {
      street: {
        type: String,
        default: "",
        trim: true
      },
      city: {
        type: String,
        default: "",
        trim: true
      },
      district: {
        type: String,
        default: "",
        trim: true
      },
      postalCode: {
        type: String,
        default: "",
        trim: true
      },
      country: {
        type: String,
        default: "Suriname",
        trim: true
      }
    },

    contacts: {
      type: [ContactSchema],
      default: []
    },

    openingHours: {
      type: [OpeningHourSchema],
      default: () => WEEKDAYS.map(day => ({
        day,
        open: day != "sunday",
        begin: day != "sunday" ? "08:00" : "",
        end: day != "sunday" ? "17:00" : ""
      }))
    },

    currency: {
      type: String,
      enum: ["USD", "EUR", "SRD"],
      default: "SRD"
    },

    timezone: {
      type: String,
      default: "America/Paramaribo"
    },

    payroll: {
      applyTax: {
        type: Boolean,
        default: false
      },
      standardHours: {
        weekday: { type: Number, default: 8, min: 0.25, max: 24 },
        saturday: { type: Number, default: 8, min: 0, max: 24 },
        sunday: { type: Number, default: 8, min: 0, max: 24 }
      },
      overtimeMultiplier: {
        type: Number,
        default: 1.5,
        min: 1,
        max: 5
      },
      saturdayDayValue: {
        type: Number,
        min: 0,
        max: 3
      },
      sundayDayValue: {
        type: Number,
        min: 0,
        max: 3
      },
      overtimeRateSource: {
        type: String,
        enum: ["base", "bonus"]
      },
      overtimeHoursBase: {
        type: String,
        enum: ["weekday", "day"]
      },
      shifts: {
        weekday: {
          working: { type: Boolean },
          begin: { type: String },
          end: { type: String },
          breakMinutes: { type: Number, min: 0 }
        },
        saturday: {
          working: { type: Boolean },
          begin: { type: String },
          end: { type: String },
          breakMinutes: { type: Number, min: 0 }
        },
        sunday: {
          working: { type: Boolean },
          begin: { type: String },
          end: { type: String },
          breakMinutes: { type: Number, min: 0 }
        }
      },
      overtimeRates: {
        weekday: { type: Number, min: 1, max: 5 },
        saturday: { type: Number, min: 1, max: 5 },
        sunday: { type: Number, min: 1, max: 5 }
      },
      lockPeriods: {
        type: Boolean,
        default: false
      },
      leaveEnabled: {
        type: Boolean,
        default: true
      },
      leaveDaysPerYear: {
        type: Number,
        default: 12,
        min: 0,
        max: 366
      }
    },

    payslip: {
      showCompanyDetails: {
        type: Boolean,
        default: false
      }
    },

    exchangeRates: {
      USD_SRD: { type: Number, min: 0 },
      SRD_USD: { type: Number, min: 0 },
      EUR_SRD: { type: Number, min: 0 },
      SRD_EUR: { type: Number, min: 0 },
      USD_EUR: { type: Number, min: 0 },
      EUR_USD: { type: Number, min: 0 },
      updatedAt: { type: Date }
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
CompanySchema.statics.WEEKDAYS = WEEKDAYS;
CompanySchema.plugin(require("../plugins/activityLog.plugin"), { entity: "company" });
module.exports = CompanySchema;
