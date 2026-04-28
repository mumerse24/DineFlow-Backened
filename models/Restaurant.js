const mongoose = require("mongoose")

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
      maxlength: [100, "Restaurant name cannot exceed 100 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    cuisine: {
      type: [String],
      required: [true, "At least one cuisine type is required"],
      enum: [
        "Italian",
        "Chinese",
        "Indian",
        "Mexican",
        "American",
        "Japanese",
        "Thai",
        "Mediterranean",
        "French",
        "Korean",
        "Vietnamese",
        "Greek",
        "Spanish",
        "Lebanese",
        "Turkish",
        "Other",
      ],
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    images: {
      logo: { type: String, required: true },
      banner: String,
      gallery: [String],
    },
    businessInfo: {
      licenseNumber: { type: String, required: true },
      taxId: { type: String, required: true },
      establishedYear: Number,
      website: String,
    },
    operatingHours: {
      monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      sunday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    },
    deliveryInfo: {
      deliveryFee: { type: Number, default: 0 },
      minimumOrder: { type: Number, default: 0 },
      deliveryRadius: { type: Number, default: 5 }, // in kilometers
      estimatedDeliveryTime: { type: String, default: "30-45 mins" },
      freeDeliveryThreshold: Number,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    features: {
      type: [String],
      enum: ["Delivery", "Pickup", "Dine-in", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free"],
      default: ["Delivery"],
    },
    paymentMethods: {
      type: [String],
      enum: ["Cash", "Card", "Digital Wallet", "Online Payment"],
      default: ["Cash", "Card"],
    },
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Index for location-based queries
restaurantSchema.index({ "address.coordinates": "2dsphere" })

// Index for search functionality
restaurantSchema.index({ name: "text", description: "text", cuisine: "text" })

module.exports = mongoose.model("Restaurant", restaurantSchema)
