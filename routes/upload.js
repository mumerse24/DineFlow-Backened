const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const { restaurantAuth } = require("../middleware/auth");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "dineflow/menu",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "avif"],
  },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit
    },
});

// @route   POST /api/upload
// @desc    Upload an image to Cloudinary
// @access  Private (Admin or Restaurant)
router.post("/", restaurantAuth, (req, res) => {
    upload.single("image")(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: "Upload error: " + err.message });
        } else if (err) {
            console.error("Cloudinary upload error:", err);
            const errMsg = err.message || err.toString() || "Unknown upload error";
            return res.status(400).json({ success: false, message: errMsg });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file provided in the request." });
        }

        res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            imageUrl: req.file.path // Cloudinary returns the full URL in req.file.path
        });
    });
});

module.exports = router;
