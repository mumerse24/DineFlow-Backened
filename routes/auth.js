const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const nodemailer = require("nodemailer")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const Admin = require("../models/Admin")
const { auth } = require("../middleware/auth")
const { AppError, catchAsync } = require("../middleware/errorHandler");


const router = express.Router()

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  })
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phone").isMobilePhone().withMessage("Please enter a valid phone number"),
    body("role").optional().isIn(["customer", "restaurant"]).withMessage("Invalid role"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { name, email, password, phone, role = "customer", address } = req.body

      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        })
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        phone,
        role,
        address,
      })

      await user.save()

      // Generate token
      const token = generateToken(user._id)

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            address: user.address,
            loyaltyPoints: user.loyaltyPoints || 0,
          },
          token,
        },
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during registration",
      })
    }
  },
)

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { email, password } = req.body

      // Find user and include password for comparison
      const user = await User.findOne({ email }).select("+password")
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account has been deactivated",
        })
      }

      // Compare password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      // Update last login
      user.lastLogin = new Date()
      await user.save()

      // Generate token
      const token = generateToken(user._id)

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            address: user.address,
            avatar: user.avatar,
            loyaltyPoints: user.loyaltyPoints || 0,
            preferences: user.preferences,
          },
          token,
        },
      })

    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during login",
      })
    }
  },
)

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    // req.user is already populated by the 'auth' middleware with either a User or Admin
    res.json({
      success: true,
      user: req.user,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  auth,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("phone").optional().isMobilePhone().withMessage("Please enter a valid phone number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { name, phone, address, preferences, avatar } = req.body

      const user = await User.findById(req.user.id)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      // Update fields
      if (name) user.name = name
      if (phone) user.phone = phone
      if (address) user.address = { ...user.address, ...address }
      if (preferences) user.preferences = { ...user.preferences, ...preferences }
      if (avatar) user.avatar = avatar

      await user.save()

      res.json({
        success: true,
        message: "Profile updated successfully",
        user,
      })
    } catch (error) {
      console.error("Update profile error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  "/change-password",
  auth,
  [
    body("currentPassword").exists().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { currentPassword, newPassword } = req.body

      const user = await User.findById(req.user.id).select("+password")
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        })
      }

      // Update password
      user.password = newPassword
      await user.save()

      res.json({
        success: true,
        message: "Password changed successfully",
      })
    } catch (error) {
      console.error("Change password error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   POST /api/auth/fcm-token
// @desc    Store FCM token for push notifications
// @access  Private
router.post("/fcm-token", auth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    let user = await User.findById(req.user.id);
    if (!user && Admin) {
      user = await Admin.findById(req.user.id);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Add token if it doesn't exist
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    res.json({ success: true, message: "FCM token stored successfully" });
  } catch (error) {
    console.error("FCM token storage error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   POST /api/auth/fcm-token
// @desc    Update FCM token for user
// @access  Private
router.post("/fcm-token", auth, async (req, res) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ success: false, message: "Token is required" })

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ success: false, message: "User not found" })

    // If token not already in array, add it
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token)
      await user.save()
    }

    res.json({ success: true, message: "FCM token synchronized" })
  } catch (error) {
    console.error("FCM token sync error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// @route   POST /api/auth/saved-addresses
// @desc    Add a saved address
// @access  Private
router.post("/saved-addresses", auth, async (req, res) => {
  try {
    const { name, address, city, state, zipCode, coordinates } = req.body
    if (!name || !address) {
      return res.status(400).json({ success: false, message: "Name and address are required" })
    }

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ success: false, message: "User not found" })

    user.savedAddresses.push({ name, address, city, state, zipCode, coordinates })
    await user.save()

    res.json({ success: true, message: "Address saved successfully", savedAddresses: user.savedAddresses })
  } catch (error) {
    console.error("Save address error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// @route   DELETE /api/auth/saved-addresses/:id
// @desc    Delete a saved address
// @access  Private
router.delete("/saved-addresses/:addressId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ success: false, message: "User not found" })

    user.savedAddresses = user.savedAddresses.filter(
      (addr) => addr._id.toString() !== req.params.addressId
    )
    await user.save()

    res.json({ success: true, message: "Address deleted successfully", savedAddresses: user.savedAddresses })
  } catch (error) {
    console.error("Delete address error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this email" })
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken()
    await user.save({ validateBeforeSave: false })

    // Create reset url (use frontend URL)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`

    // Dev fallback: Log to console
    console.log("\n" + "=".repeat(50))
    console.log(`🔐 PASSWORD RESET REQUEST`)
    console.log(`👤 User: ${user.email}`)
    console.log(`🔗 Reset Link: ${resetUrl}`)
    console.log("=".repeat(50) + "\n")

    // Send email logic
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        })

        await transporter.sendMail({
          from: `"FoodHub Support" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "Password Reset Request",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #f59e0b; text-align: center;">Reset Your Password</h2>
              <p>You requested a password reset. Click the button below to set a new password. This link will expire in 10 minutes.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: linear-gradient(to right, #f59e0b, #ea580c); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
              </div>
              <p style="color: #666; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
              <hr style="border: 0; border-top: 1px solid #eee;" />
              <p style="color: #999; font-size: 10px; text-align: center;">© 2024 FoodHub Delivery app</p>
            </div>
          `,
        })
      }
      res.json({ success: true, message: "Reset link sent successfully (check console if email not configured)", resetUrl })
    } catch (err) {
      console.error("Email send error:", err)
      // We still return success because it's logged in console for dev
      res.json({ success: true, message: "Reset link generated (Logged to console, email failed)", resetUrl })
    }
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.put("/reset-password/:token", async (req, res) => {
  try {
    // Get hashed token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex")

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" })
    }

    // Set new password
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()

    res.json({ success: true, message: "Password reset successful! You can now login with your new password." })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

module.exports = router
