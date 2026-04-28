const express = require("express")
const { body, validationResult } = require("express-validator")
const Cart = require("../models/Cart")
const MenuItem = require("../models/MenuItem")
const Restaurant = require("../models/Restaurant")
const { auth } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    // Cart is now allowed for all roles including admins for testing/purchasing

    const cart = await Cart.findOne({ user: req.user.id })
      .populate("restaurant", "name images.logo deliveryInfo")
      .populate("items.menuItem", "name price images isAvailable restaurant")

    if (!cart) {
      return res.json({
        success: true,
        data: {
          items: [],
          totals: { subtotal: 0, itemCount: 0 },
          restaurant: null,
        },
      })
    }

    // Calculate totals
    let subtotal = 0
    let itemCount = 0

    const validItems = cart.items.filter((item) => {
      if (!item.menuItem || !item.menuItem.isAvailable) {
        return false
      }

      let itemPrice = item.menuItem.price

      // Add customization costs
      if (item.customizations) {
        for (const customization of item.customizations) {
          for (const option of customization.selectedOptions) {
            itemPrice += option.price || 0
          }
        }
      }

      const itemTotal = itemPrice * item.quantity
      subtotal += itemTotal
      itemCount += item.quantity

      // Add calculated price to item
      item.calculatedPrice = itemPrice
      item.itemTotal = itemTotal

      return true
    })

    // Update cart if items were removed
    if (validItems.length !== cart.items.length) {
      cart.items = validItems
      cart.totals = { subtotal, itemCount }
      await cart.save()
    }

    res.json({
      success: true,
      data: {
        ...cart.toObject(),
        items: validItems,
        totals: { subtotal, itemCount },
      },
    })
  } catch (error) {
    console.error("Get cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post(
  "/add",
  auth,
  [
    body("menuItemId").isMongoId().withMessage("Valid menu item ID is required"),
    body("quantity").isInt().withMessage("Quantity must be an integer"),
    body("customizations").optional().isArray().withMessage("Customizations must be an array"),
  ],
  async (req, res) => {
    try {
      // Cart is now allowed for all roles

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { menuItemId, quantity, customizations, specialInstructions, removedIngredients, spiceLevel } = req.body

      // Verify menu item exists and is available
      const menuItem = await MenuItem.findById(menuItemId).populate("restaurant")
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Menu item is not available",
        })
      }

      // Verify restaurant is active


      let cart = await Cart.findOne({ user: req.user.id })

      // If cart doesn't exist, create new one
      if (!cart) {
        cart = new Cart({
          user: req.user.id,
          restaurant: menuItem.restaurant._id,
          items: [],
        })
      }

      // If cart has items from different restaurant, clear it
      if (cart.restaurant && cart.restaurant.toString() !== menuItem.restaurant._id.toString()) {
        cart.items = []
        cart.restaurant = menuItem.restaurant._id
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex((item) => {
        return (
          item.menuItem.toString() === menuItemId &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations || []) &&
          JSON.stringify(item.removedIngredients) === JSON.stringify(removedIngredients || []) &&
          item.spiceLevel === (spiceLevel || "Mild")
        )
      })

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        cart.items[existingItemIndex].quantity += quantity
        
        // If quantity becomes 0 or less, remove the item
        if (cart.items[existingItemIndex].quantity <= 0) {
          cart.items.splice(existingItemIndex, 1)
        } else {
          cart.items[existingItemIndex].specialInstructions =
            specialInstructions || cart.items[existingItemIndex].specialInstructions
        }
      } else {
        // Add new item to cart
        cart.items.push({
          menuItem: menuItemId,
          quantity,
          customizations: customizations || [],
          removedIngredients: removedIngredients || [],
          spiceLevel: spiceLevel || "Mild",
          specialInstructions: specialInstructions || "",
        })
      }

      await cart.save()

      // Populate and return updated cart
      const updatedCart = await Cart.findById(cart._id)
        .populate("restaurant", "name images.logo deliveryInfo")
        .populate("items.menuItem", "name price images restaurant")

      res.json({
        success: true,
        message: "Item added to cart",
        data: updatedCart,
      })
    } catch (error) {
      console.error("Add to cart error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/cart/update/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put(
  "/update/:itemId",
  auth,
  [body("quantity").isInt({ min: 0 }).withMessage("Quantity must be a non-negative integer")],
  async (req, res) => {
    try {
      // Cart is now allowed for all roles

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { quantity } = req.body

      const cart = await Cart.findOne({ user: req.user.id })
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        })
      }

      const itemIndex = cart.items.findIndex((item) => item._id.toString() === req.params.itemId)
      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Item not found in cart",
        })
      }

      if (quantity === 0) {
        // Remove item from cart
        cart.items.splice(itemIndex, 1)
      } else {
        // Update quantity
        cart.items[itemIndex].quantity = quantity
      }

      await cart.save()

      // Populate and return updated cart
      const updatedCart = await Cart.findById(cart._id)
        .populate("restaurant", "name images.logo deliveryInfo")
        .populate("items.menuItem", "name price images restaurant")

      res.json({
        success: true,
        message: "Cart updated successfully",
        data: updatedCart,
      })
    } catch (error) {
      console.error("Update cart error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   DELETE /api/cart/remove/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete("/remove/:itemId", auth, async (req, res) => {
  try {
    // Cart is now allowed for all roles

    const cart = await Cart.findOne({ user: req.user.id })
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      })
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === req.params.itemId || (item.menuItem && item.menuItem.toString() === req.params.itemId)
    )
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      })
    }

    cart.items.splice(itemIndex, 1)
    await cart.save()

    // Populate and return updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate("restaurant", "name images.logo deliveryInfo")
      .populate("items.menuItem", "name price images restaurant")

    res.json({
      success: true,
      message: "Item removed from cart",
      data: updatedCart,
    })
  } catch (error) {
    console.error("Remove from cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete("/clear", auth, async (req, res) => {
  try {
    // Cart is now allowed for all roles

    await Cart.findOneAndDelete({ user: req.user.id })

    res.json({
      success: true,
      message: "Cart cleared successfully",
    })
  } catch (error) {
    console.error("Clear cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/cart/sync
// @desc    Sync cart from local storage to server
// @access  Private
router.post("/sync", auth, async (req, res) => {
  try {
    // Cart is now allowed for all roles

    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "Items array is required" });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (items.length === 0) {
      if (cart) {
        cart.items = [];
        cart.restaurant = null;
        await cart.save();
      }
      return res.json({ success: true, data: [] });
    }

    const firstItem = items.find(item => item && item.menuItem);
    let restaurantId = null;
    if (firstItem) {
      // Try to get restaurant from menuItem (if it's an object) or from a top-level property
      const menuItem = firstItem.menuItem;
      const rest = menuItem.restaurant || firstItem.restaurantId || firstItem.restaurant;
      restaurantId = typeof rest === 'object' && rest !== null ? rest._id : rest;
    }

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        restaurant: restaurantId,
        items: []
      });
    } else if (restaurantId) {
      cart.restaurant = restaurantId;
    }

    cart.items = items.map(item => ({
      menuItem: item.menuItem._id,
      quantity: item.quantity,
      customizations: item.selectedCustomizations || [],
      specialInstructions: item.specialInstructions || ""
    }));

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate("restaurant", "name images.logo deliveryInfo")
      .populate("items.menuItem", "name price images isAvailable restaurant");

    res.json({
      success: true,
      message: "Cart synced successfully",
      data: updatedCart
    });
  } catch (error) {
    console.error("Sync cart error:", error);
    res.status(500).json({ success: false, message: "Server error during cart sync" });
  }
});

module.exports = router
