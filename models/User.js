const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const crypto = require("crypto")

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    role: {
      type: String,
      enum: ["customer", "restaurant", "admin", "rider"],
      default: "customer",
    },
    riderStatus: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "offline",
    },
    stats: {
      totalDeliveries: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      pendingCashToRemit: { type: Number, default: 0 }
    },
    // 🔥 BATCH DELIVERY FIELDS 🔥
    currentRestaurantPickup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },
    activeOrderCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        type: Object,
        default: {}
      },
    },
    currentLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date
    },
    avatar: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    preferences: {
      cuisine: [String],
      dietaryRestrictions: [String],
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
    },
    fcmTokens: {
      type: [String],
      default: [],
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    savedAddresses: [
      {
        name: { type: String, required: true },
        address: { type: String, required: true },
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
        isDefault: { type: Boolean, default: false },
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.password
  return user
}

// Get reset password token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex")

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex")

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000

  return resetToken
}

module.exports = mongoose.model("User", userSchema)
