const mongoose = require("mongoose");
const { hashPassword, isBcryptHash } = require('../../shared/utils/password');
const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true
    },

    lastName: {
      type: String,
      trim: true
    },
    
    lastName: {
      type: String,
      trim: true
    },

    email: {
      type: String,
      lowercase: true,
      trim: true
    },

    address: {
      type: String,
      trim: true
    },

    phone: {
      type: String,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["admin", "payroll", "viewer", "manager", "employee"],
      default: "employee",
      index: true
    },

    lastLoginAt: {
      type: Date
    },

    mustChangePassword: {
      type: Boolean,
      default: false
    },

    profileImage: {
      type: String,
      default: null
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
UserSchema.pre('save', async function () {
  if (!this.isModified('password') || isBcryptHash(this.password)) return;
  this.password = await hashPassword(this.password);
});
UserSchema.plugin(require("../plugins/activityLog.plugin"), { entity: "user" });
module.exports = UserSchema;