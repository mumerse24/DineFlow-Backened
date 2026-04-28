const express = require("express");
const router = express.Router();
const Landmark = require("../models/Landmark");
const { adminAuth } = require("../middleware/auth");

// @route   GET /api/landmarks
// @desc    Get all active public landmarks
// @access  Public
router.get("/", async (req, res) => {
    try {
        const landmarks = await Landmark.find({ isActive: true });
        res.json({
            success: true,
            data: landmarks,
        });
    } catch (error) {
        console.error("Fetch landmarks error:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching landmarks",
        });
    }
});

// @route   POST /api/landmarks
// @desc    Create a new public landmark
// @access  Private (Admin only)
router.post("/", adminAuth, async (req, res) => {
    try {
        const { name, coordinates } = req.body;

        if (!name || !coordinates || !coordinates.lat || !coordinates.lng) {
            return res.status(400).json({
                success: false,
                message: "Name and coordinates (lat, lng) are required",
            });
        }

        const newLandmark = new Landmark({
            name,
            coordinates,
            createdBy: req.admin ? req.admin._id : req.user._id,
        });

        await newLandmark.save();

        res.status(201).json({
            success: true,
            message: "Landmark created successfully",
            data: newLandmark,
        });
    } catch (error) {
        console.error("Create landmark error:", error);
        res.status(500).json({
            success: false,
            message: "Server error creating landmark",
        });
    }
});

// @route   DELETE /api/landmarks/:id
// @desc    Delete a public landmark
// @access  Private (Admin only)
router.delete("/:id", adminAuth, async (req, res) => {
    try {
        const landmark = await Landmark.findById(req.params.id);

        if (!landmark) {
            return res.status(404).json({
                success: false,
                message: "Landmark not found",
            });
        }

        await landmark.deleteOne();

        res.json({
            success: true,
            message: "Landmark deleted successfully",
        });
    } catch (error) {
        console.error("Delete landmark error:", error);
        res.status(500).json({
            success: false,
            message: "Server error deleting landmark",
        });
    }
});

module.exports = router;
