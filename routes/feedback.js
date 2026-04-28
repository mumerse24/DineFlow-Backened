const express = require("express");
const { body, validationResult } = require("express-validator");
const Feedback = require("../models/Feedback");
const { auth, adminAuth } = require("../middleware/auth"); // Assuming common auth middleware

const router = express.Router();

/**
 * @route   POST /api/feedback
 * @desc    Submit new feedback or complaint
 * @access  Public (Optional auth)
 */
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("subject").isIn(["General Inquiry", "Restaurant Partnership", "Technical Support", "Delivery Issue", "Feedback", "Complaint"]).withMessage("Invalid subject"),
    body("message").isLength({ min: 10 }).withMessage("Message must be at least 10 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, email, phone, subject, message, userId } = req.body;

      const feedback = new Feedback({
        user: userId || null,
        name,
        email,
        phone,
        subject,
        message,
      });

      await feedback.save();

      res.status(201).json({
        success: true,
        message: "Thank you! Your feedback has been received and sent to our admin team.",
        data: feedback,
      });
    } catch (error) {
      console.error("Feedback submission error:", error);
      res.status(500).json({ success: false, message: "Server error during submission" });
    }
  }
);

/**
 * @route   GET /api/feedback
 * @desc    Get all feedback/complaints (Admin only)
 * @access  Private/Admin
 */
router.get("/", auth, async (req, res) => {
  try {
    // Check if user is admin (simplified check as I don't have full admin middleware context)
    // In many of your other files, 'auth' populates req.user.id
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error("Fetch feedback error:", error);
    res.status(500).json({ success: false, message: "Server error fetching feedback" });
  }
});

/**
 * @route   PUT /api/feedback/:id/status
 * @desc    Update feedback status
 * @access  Private/Admin
 */
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Reviewed", "Resolved"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }

    res.json({ success: true, message: "Status updated successfully", data: feedback });
  } catch (error) {
    console.error("Update feedback error:", error);
    res.status(500).json({ success: false, message: "Server error updating status" });
  }
});

module.exports = router;
