const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: [true, "Menu Item ID is required"],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    userName: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

// Prevent multiple reviews from the same user for the same dish
reviewSchema.index({ user: 1, menuItem: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
