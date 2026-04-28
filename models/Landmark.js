const mongoose = require("mongoose");

const landmarkSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        coordinates: {
            lat: {
                type: Number,
                required: true,
            },
            lng: {
                type: Number,
                required: true,
            },
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Landmark", landmarkSchema);
