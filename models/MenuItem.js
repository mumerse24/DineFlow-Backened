const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant ID is required"],
      index: true,
      // ✅ Validate ObjectId format
      validate: {
        validator: function(v) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: "Invalid Restaurant ID format"
      }
    },

    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: [100, "Item name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Special Deals", "Burgers", "Pizza", "Sides", "Chinese", "Salads", 
        "Beverages", "Desserts", "Main Course", "Appetizers", 
        "Fast Food", "Indian", "Italian", "Other",
      ],
      default: "Other",
      index: true,
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
      validate: {
        validator: function(v) {
          return !v || v >= this.price;
        },
        message: "Original price cannot be less than current price"
      }
    },

    images: {
      type: [String],
      required: [true, "At least one image is required"],
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: "At least one image is required"
      }
    },

    ingredients: [String],

    allergens: {
      type: [String],
      enum: ["Nuts", "Dairy", "Eggs", "Soy", "Wheat", "Fish", "Shellfish", "Sesame"],
    },

    nutritionalInfo: {
      calories: { type: Number, min: 0 },
      protein: { type: Number, min: 0 },
      carbs: { type: Number, min: 0 },
      fat: { type: Number, min: 0 },
      fiber: { type: Number, min: 0 },
      sugar: { type: Number, min: 0 },
      sodium: { type: Number, min: 0 },
    },

    dietaryTags: {
      type: [String],
      enum: [
        "Vegetarian", "Vegan", "Gluten-free", "Dairy-free",
        "Nut-free", "Keto", "Low-carb", "Halal", "Kosher",
      ],
    },

    spiceLevel: {
      type: String,
      enum: ["Mild", "Medium", "Hot", "Extra Hot"],
      default: "Mild",
    },

    preparationTime: {
      type: String,
      default: "15-20 mins",
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    isPopular: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    customizations: [
      {
        name: { type: String, required: true },
        options: [
          {
            name: { type: String, required: true },
            price: { type: Number, default: 0, min: 0 },
          },
        ],
        required: { type: Boolean, default: false },
        multiSelect: { type: Boolean, default: false },
      },
    ],

    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    orderCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    isDeal: {
      type: Boolean,
      default: false,
      index: true,
    },

    dealItems: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    // ✅ Automatically populate restaurant reference
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ============ INDEXES ============
// Compound Index for faster filtering
menuItemSchema.index({ restaurant: 1, category: 1, isAvailable: 1 });

// Text Search Index
menuItemSchema.index({
  name: "text",
  description: "text",
  ingredients: "text",
});

// Popular items index
menuItemSchema.index({ restaurant: 1, isPopular: -1 });

// Price range index
menuItemSchema.index({ restaurant: 1, price: 1 });

// ============ VIRTUALS ============
// Virtual for discounted price
menuItemSchema.virtual("finalPrice").get(function () {
  if (this.discountPercentage > 0) {
    return this.price - (this.price * this.discountPercentage) / 100;
  }
  return this.price;
});

// Virtual for savings amount
menuItemSchema.virtual("savings").get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return this.originalPrice - this.price;
  }
  return 0;
});

// ============ METHODS ============
// Check if item is in stock
menuItemSchema.methods.isInStock = function() {
  return this.isAvailable === true;
};

// Update rating
menuItemSchema.methods.updateRating = function(newRating) {
  const total = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = total / this.rating.count;
  return this.save();
};

// ============ STATICS ============
// Find by restaurant with filters
menuItemSchema.statics.findByRestaurant = function(restaurantId, filters = {}) {
  const query = { restaurant: restaurantId, ...filters };
  return this.find(query).sort({ createdAt: -1 });
};

// Get available items
menuItemSchema.statics.getAvailableItems = function(restaurantId) {
  return this.find({ 
    restaurant: restaurantId, 
    isAvailable: true 
  });
};

// Get popular items
menuItemSchema.statics.getPopularItems = function(restaurantId, limit = 10) {
  return this.find({ 
    restaurant: restaurantId, 
    isPopular: true,
    isAvailable: true 
  }).limit(limit);
};

// ============ MIDDLEWARE ============
// Before save: ensure originalPrice >= price
menuItemSchema.pre("save", function(next) {
  if (this.originalPrice && this.originalPrice < this.price) {
    this.originalPrice = this.price;
  }
  next();
});

// After save: log activity (optional)
menuItemSchema.post("save", function(doc) {
  console.log(`✅ Menu item saved: ${doc.name} (${doc._id})`);
});

module.exports = mongoose.model("MenuItem", menuItemSchema);