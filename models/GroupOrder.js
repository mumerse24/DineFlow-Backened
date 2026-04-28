const mongoose = require("mongoose")

const groupOrderSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["open", "closed", "placed"],
      default: "open",
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String, // For guests or just to display
        items: [
          {
            menuItem: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "MenuItem",
            },
            quantity: Number,
            customizations: [
              {
                name: String,
                selectedOptions: [
                  {
                    name: String,
                    price: Number,
                  },
                ],
              },
            ],
            removedIngredients: [String],
            spiceLevel: String,
            specialInstructions: String,
          },
        ],
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("GroupOrder", groupOrderSchema)
