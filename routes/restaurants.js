const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Restaurant = require("../models/Restaurant")
const MenuItem = require("../models/MenuItem")
const { auth, adminAuth, restaurantAuth } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/restaurants
// @desc    Get all restaurants with filtering and pagination
// @access  Public
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
    query("cuisine").optional().isString().withMessage("Cuisine must be a string"),
    query("rating").optional().isFloat({ min: 0, max: 5 }).withMessage("Rating must be between 0 and 5"),
    query("search").optional().isString().withMessage("Search must be a string"),
    query("lat").optional().isFloat().withMessage("Latitude must be a number"),
    query("lng").optional().isFloat().withMessage("Longitude must be a number"),
    query("radius").optional().isFloat({ min: 0 }).withMessage("Radius must be a positive number"),
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

      const {
        page = 1,
        limit = 12,
        cuisine,
        rating,
        search,
        lat,
        lng,
        radius = 10,
        sortBy = "rating.average",
        sortOrder = "desc",
      } = req.query

      // Build query
      const query = { status: "approved", isActive: true }

      // Cuisine filter
      if (cuisine) {
        query.cuisine = { $in: [cuisine] }
      }

      // Rating filter
      if (rating) {
        query["rating.average"] = { $gte: Number.parseFloat(rating) }
      }

      // Text search
      if (search) {
        query.$text = { $search: search }
      }

      // Location-based search
      if (lat && lng) {
        query["address.coordinates"] = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number.parseFloat(lng), Number.parseFloat(lat)],
            },
            $maxDistance: Number.parseFloat(radius) * 1000, // Convert km to meters
          },
        }
      }

      // Sort options
      const sortOptions = {}
      if (sortBy === "rating") {
        sortOptions["rating.average"] = sortOrder === "asc" ? 1 : -1
      } else if (sortBy === "name") {
        sortOptions.name = sortOrder === "asc" ? 1 : -1
      } else if (sortBy === "deliveryTime") {
        sortOptions["deliveryInfo.estimatedDeliveryTime"] = sortOrder === "asc" ? 1 : -1
      } else {
        sortOptions.createdAt = -1
      }

      const restaurants = await Restaurant.find(query)
        .populate("owner", "name email")
        .sort(sortOptions)
        .limit(Number.parseInt(limit))
        .skip((Number.parseInt(page) - 1) * Number.parseInt(limit))
        .select("-businessInfo -socialMedia")

      const total = await Restaurant.countDocuments(query)

      res.json({
        success: true,
        data: restaurants,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / Number.parseInt(limit)),
          total,
          limit: Number.parseInt(limit),
        },
      })
    } catch (error) {
      console.error("Get restaurants error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/restaurants/:id
// @desc    Get single restaurant by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate("owner", "name email")

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      })
    }

    res.json({
      success: true,
      data: restaurant,
    })
  } catch (error) {
    console.error("Get restaurant error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/restaurants
// @desc    Register a new restaurant
// @access  Private (Restaurant owners)
router.post(
  "/",
  auth,
  [
    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("phone").isMobilePhone().withMessage("Please enter a valid phone number"),
    body("description")
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage("Description must be between 10 and 500 characters"),
    body("cuisine").isArray({ min: 1 }).withMessage("At least one cuisine type is required"),
    body("address.street").notEmpty().withMessage("Street address is required"),
    body("address.city").notEmpty().withMessage("City is required"),
    body("address.state").notEmpty().withMessage("State is required"),
    body("address.zipCode").notEmpty().withMessage("Zip code is required"),
    body("address.coordinates.lat").isFloat().withMessage("Valid latitude is required"),
    body("address.coordinates.lng").isFloat().withMessage("Valid longitude is required"),
    body("images.logo").isURL().withMessage("Valid logo URL is required"),
    body("businessInfo.licenseNumber").notEmpty().withMessage("License number is required"),
    body("businessInfo.taxId").notEmpty().withMessage("Tax ID is required"),
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

      // Check if user already has a restaurant
      const existingRestaurant = await Restaurant.findOne({ owner: req.user.id })
      if (existingRestaurant) {
        return res.status(400).json({
          success: false,
          message: "You already have a registered restaurant",
        })
      }

      const restaurant = new Restaurant({
        ...req.body,
        owner: req.user.id,
      })

      await restaurant.save()

      res.status(201).json({
        success: true,
        message: "Restaurant registered successfully. Pending admin approval.",
        data: restaurant,
      })
    } catch (error) {
      console.error("Register restaurant error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/restaurants/:id
// @desc    Update restaurant
// @access  Private (Restaurant owner or admin)
router.put("/:id", restaurantAuth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      })
    }

    // Check ownership (unless admin)
    if (req.user.role !== "admin" && restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this restaurant",
      })
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.json({
      success: true,
      message: "Restaurant updated successfully",
      data: updatedRestaurant,
    })
  } catch (error) {
    console.error("Update restaurant error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   DELETE /api/restaurants/:id
// @desc    Delete restaurant
// @access  Private (Admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      })
    }

    await Restaurant.findByIdAndDelete(req.params.id)
    await MenuItem.deleteMany({ restaurant: req.params.id })

    res.json({
      success: true,
      message: "Restaurant deleted successfully",
    })
  } catch (error) {
    console.error("Delete restaurant error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   PUT /api/restaurants/:id/status
// @desc    Update restaurant status (approve/reject)
// @access  Private (Admin only)
router.put(
  "/:id/status",
  adminAuth,
  [body("status").isIn(["approved", "rejected", "suspended"]).withMessage("Invalid status")],
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

      const { status } = req.body

      const restaurant = await Restaurant.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true },
      )

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        })
      }

      res.json({
        success: true,
        message: `Restaurant ${status} successfully`,
        data: restaurant,
      })
    } catch (error) {
      console.error("Update restaurant status error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

module.exports = router
