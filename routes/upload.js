const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { restaurantAuth } = require("../middleware/auth");

// Ensure upload directory exists securely
const uploadDir = path.join(__dirname, "../public/images/menu");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename preserving extension safely
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        // Sanitize original filename or just use extension
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, "menu-" + uniqueSuffix + ext);
    },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Not an image! Please upload a valid image file."), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit
    },
});

// @route   POST /api/upload
// @desc    Upload an image to the server storage
// @access  Private (Admin or Restaurant)
router.post("/", restaurantAuth, (req, res) => {
    // 'image' is the field name that the frontend will use
    upload.single("image")(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer-specific error occurred when uploading (e.g. file too large)
            return res.status(400).json({ success: false, message: "Upload error: " + err.message });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).json({ success: false, message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file provided in the request." });
        }

        // Since server.js already mounts app.use(express.static("public")),
        // the frontend can access images relative to backend.
        // We MUST return relative paths because absolute URLs will break
        // when moving between different environments or hosting providers.
        const relativeUrl = `/images/menu/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            imageUrl: relativeUrl // Now returning relative URL!
        });
    });
});

module.exports = router;
