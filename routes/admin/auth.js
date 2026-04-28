const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../../models/Admin");

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again."
      });
    }
    
    return res.status(401).json({
      success: false,
      message: "Invalid token."
    });
  }
};

// 🔐 Admin Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔹 Debug logs
    console.log("💡 Incoming login request");
    console.log("Email:", email);
    console.log("Password:", password ? "Provided" : "Not provided");

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    // Clean email
    const cleanEmail = email.toLowerCase().trim();
    console.log("💡 Cleaned email:", cleanEmail);

    // Find admin
    const admin = await Admin.findOne({ email: cleanEmail });
    console.log("💡 Admin found:", admin ? true : false);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated"
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log("💡 Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Continue with JWT creation...
    const token = jwt.sign(
      { id: admin._id, email: admin.email, name: admin.name, role: admin.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLogin: new Date(),
      }
    });

  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// 👤 Get Admin Profile (Protected)
router.get("/profile", verifyAdminToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    res.json({
      success: true,
      admin
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// 🔑 Change Password (Protected)
router.put("/change-password", verifyAdminToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters"
      });
    }

    const admin = await Admin.findById(req.admin.id);
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// 🚪 Logout
router.post("/logout", verifyAdminToken, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

// ✅ Verify Token
router.get("/verify", verifyAdminToken, (req, res) => {
  res.json({
    success: true,
    message: "Token is valid",
    admin: req.admin
  });
});

module.exports = router;