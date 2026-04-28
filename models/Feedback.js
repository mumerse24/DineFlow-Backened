const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: false,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      enum: ["General Inquiry", "Restaurant Partnership", "Technical Support", "Delivery Issue", "Feedback", "Complaint"],
      default: "Feedback",
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Resolved"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
