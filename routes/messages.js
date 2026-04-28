const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const Message = require("../models/Message");

// @route   GET /api/messages/:orderId
// @desc    Get chat history for an order
// @access  Private
router.get("/:orderId", auth, async (req, res) => {
    try {
        const messages = await Message.find({ order: req.params.orderId })
            .sort({ createdAt: 1 })
            .populate("sender", "name role");

        res.json({ success: true, data: messages });
    } catch (error) {
        console.error("Fetch messages error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
