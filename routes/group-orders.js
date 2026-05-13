const express = require("express")
const GroupOrder = require("../models/GroupOrder")
const MenuItem = require("../models/MenuItem")
const { auth } = require("../middleware/auth")
const crypto = require("crypto")
const { getIO } = require("../utils/socket")

const router = express.Router()

// @route   POST /api/group-orders/create
// @desc    Create a group order
// @access  Private
router.post("/create", auth, async (req, res) => {
  try {
    const { restaurantId } = req.body
    
    const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase()
    
    const groupOrder = new GroupOrder({
      host: req.user.id,
      restaurant: restaurantId,
      inviteCode,
      members: [{
        user: req.user.id,
        name: req.user.name || "Host",
        items: []
      }]
    })

    await groupOrder.save()
    
    res.json({
      success: true,
      data: groupOrder
    })
  } catch (error) {
    console.error("Create group order error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// @route   GET /api/group-orders/:inviteCode
// @desc    Get group order details
// @access  Public (or Private)
router.get("/:inviteCode", async (req, res) => {
  try {
    const groupOrder = await GroupOrder.findOne({ inviteCode: req.params.inviteCode })
      .populate("restaurant", "name image")
      .populate("members.items.menuItem", "name price images")

    if (!groupOrder) {
      return res.status(404).json({ success: false, message: "Group order not found" })
    }

    res.json({ success: true, data: groupOrder })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// @route   POST /api/group-orders/:inviteCode/join
// @desc    Join a group order
// @access  Private
router.post("/:inviteCode/join", auth, async (req, res) => {
  try {
    const groupOrder = await GroupOrder.findOne({ inviteCode: req.params.inviteCode })
    if (!groupOrder) {
      return res.status(404).json({ success: false, message: "Group order not found" })
    }

    if (groupOrder.status !== "open") {
      return res.status(400).json({ success: false, message: "Group order is closed" })
    }

    const isMember = groupOrder.members.some(m => m.user && m.user.toString() === req.user.id)
    if (!isMember) {
      groupOrder.members.push({
        user: req.user.id,
        name: req.user.name,
        items: []
      })
      await groupOrder.save()
      
      // Broadcast update
      const io = getIO()
      const populatedOrder = await GroupOrder.findById(groupOrder._id)
        .populate("restaurant", "name image")
        .populate("members.items.menuItem", "name price images")
      io.to(`group_${req.params.inviteCode}`).emit("groupOrderUpdated", populatedOrder)
    }

    res.json({ success: true, data: groupOrder })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// @route   POST /api/group-orders/:inviteCode/add-item
// @desc    Add item to group order
// @access  Private
router.post("/:inviteCode/add-item", auth, async (req, res) => {
  try {
    const { menuItemId, quantity, customizations, specialInstructions, removedIngredients, spiceLevel } = req.body
    
    const groupOrder = await GroupOrder.findOne({ inviteCode: req.params.inviteCode })
    if (!groupOrder) {
      return res.status(404).json({ success: false, message: "Group order not found" })
    }

    const memberIndex = groupOrder.members.findIndex(m => m.user && m.user.toString() === req.user.id)
    if (memberIndex === -1) {
      return res.status(403).json({ success: false, message: "Not a member of this group order" })
    }

    groupOrder.members[memberIndex].items.push({
      menuItem: menuItemId,
      quantity,
      customizations: customizations || [],
      removedIngredients: removedIngredients || [],
      spiceLevel: spiceLevel || "Mild",
      specialInstructions: specialInstructions || ""
    })

    await groupOrder.save()
    
    // Broadcast update
    const io = getIO()
    const populatedOrder = await GroupOrder.findById(groupOrder._id)
      .populate("restaurant", "name image")
      .populate("members.items.menuItem", "name price images")
    io.to(`group_${req.params.inviteCode}`).emit("groupOrderUpdated", populatedOrder)

    res.json({ success: true, data: populatedOrder })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

module.exports = router
