const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const MenuItem = require("../models/MenuItem");
const { auth } = require("../middleware/auth");

// @desc    Get all reviews for a menu item
// @route   GET /api/reviews/:menuItemId
// @access  Public
router.get("/:menuItemId", async (req, res) => {
  try {
    const reviews = await Review.find({ menuItem: req.params.menuItemId })
      .sort({ createdAt: -1 })
      .populate("user", "name");

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
});

// @desc    Add a review for a menu item
// @route   POST /api/reviews
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { menuItemId, rating, comment } = req.body;

    // Check if item exists
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      menuItem: menuItemId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this item",
      });
    }

    const review = await Review.create({
      user: req.user._id,
      userName: req.user.name,
      menuItem: menuItemId,
      rating: Number(rating),
      comment,
    });

    // Update menu item rating
    await menuItem.updateRating(Number(rating));

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
});

module.exports = router;
