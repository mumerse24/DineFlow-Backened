const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin"); // ✅ Import the separate Admin model

// ==============================
// 1. HELPER FUNCTIONS
// ==============================

// Helper: Extract Token from Header
const getTokenFromHeader = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

// Helper: Verify Token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { decoded, error: null };
  } catch (error) {
    return { decoded: null, error };
  }
};

// ==============================
// 2. MIDDLEWARE FUNCTIONS
// ==============================

// 🟢 Standard User Auth (Customers/Restaurants)
const auth = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "Authorization header missing or invalid" });
    }

    const { decoded, error } = verifyToken(token);
    if (error) {
      return res.status(401).json({
        success: false,
        message: error.name === "TokenExpiredError" ? "Token expired" : "Invalid token"
      });
    }

    // Check User collection first
    let user = await User.findById(decoded.id).select("-password");

    // Fallback to Admin collection if not found (for admins using standard auth routes)
    if (!user && Admin) {
      user = await Admin.findById(decoded.id).select("-password");
    }

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔐 Admin Auth (Checks BOTH Admin and User collections)
const adminAuth = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "Admin authorization required" });
    }

    const { decoded, error } = verifyToken(token);
    if (error) {
      return res.status(401).json({ success: false, message: "Invalid or expired admin token" });
    }

    // 1️⃣ STRATEGY: Check Admin Collection First
    let account = await Admin.findById(decoded.id).select("-password");
    let isFromAdminCollection = true;

    // 2️⃣ STRATEGY: Fallback to User Collection
    if (!account) {
      account = await User.findById(decoded.id).select("-password");
      isFromAdminCollection = false;
    }

    if (!account) {
      return res.status(401).json({ success: false, message: "Admin account not found" });
    }

    // 3️⃣ Verify Privileges
    // If it's from User collection, we must check the role field
    if (!isFromAdminCollection) {
      if (account.role !== "admin" && account.role !== "superadmin") {
        return res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
      }
    }

    // 4️⃣ Attach to Request
    // We attach to BOTH req.admin (for new routes) and req.user (for old dashboard routes)
    req.admin = account;
    req.user = account;

    next();
  } catch (error) {
    console.error("Admin Auth Error:", error);
    res.status(500).json({ success: false, message: "Server error in admin authentication" });
  }
};

// 🍽️ Restaurant Auth
const restaurantAuth = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    const { decoded, error } = verifyToken(token);
    if (error) return res.status(401).json({ success: false, message: "Invalid token" });

    const user = await User.findById(decoded.id).select("-password");

    if (!user || (user.role !== "restaurant" && user.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Restaurant privileges required" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Restaurant Auth Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { auth, adminAuth, restaurantAuth };