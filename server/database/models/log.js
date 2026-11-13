const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
  {
    model: {
      type: String,
      required: true
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE"],
      required: true,
    },

    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },

    label: {
      type: String,
      default: ""
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    changedByName: {
      type: String,
      default: ""
    },

    deleted: {
      type: Boolean,
      default: false
    }
    
  },
  { timestamps: true }
);
LogSchema.index({ createdAt: -1 });
LogSchema.index({ model: 1, createdAt: -1 });
module.exports = LogSchema;