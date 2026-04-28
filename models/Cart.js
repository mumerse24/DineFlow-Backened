const mongoose = require("mongoose")

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        customizations: [
          {
            name: String,
            selectedOptions: [
              {
                name: String,
                price: { type: Number, default: 0 },
              },
            ],
          },
        ],
        removedIngredients: [String],
        spiceLevel: {
          type: String,
          enum: ["Mild", "Medium", "Hot", "Extra Hot"],
          default: "Mild",
        },
        specialInstructions: String,
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totals: {
      subtotal: { type: Number, default: 0 },
      itemCount: { type: Number, default: 0 },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Update totals before saving
cartSchema.pre("save", function (next) {
  this.lastUpdated = new Date()
  next()
})

module.exports = mongoose.model("Cart", cartSchema)
