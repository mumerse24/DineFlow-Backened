const User = require("../models/User");
const Order = require("../models/Order");

// Haversine distance formula to calculate distance in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999; // Fallback to large distance if missing coords
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

/**
 * Smart Batch Delivery Engine
 * Automatically assigns an available rider OR batches the order to a rider who is already at the same restaurant.
 */
const autoAssignOrder = async (orderId) => {
    try {
        const order = await Order.findById(orderId);

        if (!order || order.status === "cancelled" || order.assignedDriver) {
            return false;
        }

        const restaurantId = order.restaurant;
        const newOrderCoords = order.deliveryAddress?.coordinates;
        let selectedRider = null;
        let isBatchAssignment = false;

        // ==========================================
        // 🚀 STEP 1: SMART BATCHING SYSTEM
        // ==========================================
        // Look for riders already picking up from this restaurant who have capacity
        const batchCandidates = await User.find({
            role: "rider",
            isActive: true,
            riderStatus: "busy", // If they are busy but have < 3 orders, they might be batchable
            currentRestaurantPickup: restaurantId,
            activeOrderCount: { $lt: 3, $gte: 1 } // Max 3 orders allowed per batch
        });

        if (batchCandidates.length > 0 && newOrderCoords) { // Requires coordinates to batch smartly
            for (const candidate of batchCandidates) {
                // Find this rider's CURRENT active orders to check delivery proximity
                const existingOrders = await Order.find({
                    assignedDriver: candidate._id,
                    status: { $in: ["preparing", "ready", "picked_up", "out_for_delivery"] }
                });

                if (existingOrders.length > 0 && existingOrders[0].deliveryAddress?.coordinates) {
                    const existingCoords = existingOrders[0].deliveryAddress.coordinates;
                    const distance = calculateDistance(
                        newOrderCoords.lat, newOrderCoords.lng,
                        existingCoords.lat, existingCoords.lng
                    );

                    // Allow batching if delivery addresses are within a 3km radius
                    if (distance <= 3) {
                        selectedRider = candidate;
                        isBatchAssignment = true;
                        break;
                    }
                }
            }
        }

        // ==========================================
        // 🚀 STEP 2: STANDARD FALLBACK ASSIGNMENT
        // ==========================================
        if (!selectedRider) {
            selectedRider = await User.findOne({
                role: "rider",
                riderStatus: "available",
                isActive: true
            });
        }

        if (!selectedRider) {
            console.log(`[Auto-Assign] No available riders (or batch candidates) for order ${orderId}.`);
            return false;
        }

        // ==========================================
        // 🚀 STEP 3: PERFORM ASSIGNMENT & DB UPDATES
        // ==========================================
        order.assignedDriver = selectedRider._id;
        order.assignedAt = new Date();
        order.status = "out_for_delivery";
        order.timeline.push({
            status: "out_for_delivery",
            timestamp: new Date(),
            note: isBatchAssignment
                ? `Smart Batched with Rider: ${selectedRider.name}`
                : `Auto-assigned to rider: ${selectedRider.name}`
        });

        await order.save();

        // Update Rider State for Batch Tracking
        selectedRider.riderStatus = "busy";
        selectedRider.currentRestaurantPickup = restaurantId;
        selectedRider.activeOrderCount = (selectedRider.activeOrderCount || 0) + 1;
        await selectedRider.save();

        console.log(`[Smart Match] 🔥 ${isBatchAssignment ? 'BATCH' : 'NEW'} assigned Order ${orderId} to Rider ${selectedRider.name} (Active Orders: ${selectedRider.activeOrderCount})`);

        // ==========================================
        // 🚀 STEP 4: EMIT SOCKET EVENTS
        // ==========================================
        try {
            const { getIO } = require("./socket");
            const io = getIO();
            if (io) {
                const populatedOrder = await Order.findById(order._id)
                    .populate("customer", "name phone email")
                    .populate("restaurant", "name phone")
                    .populate("assignedDriver", "name phone")
                    .lean();

                io.emit("orderAssignedToRider", {
                    riderId: selectedRider._id,
                    order: populatedOrder,
                    isBatch: isBatchAssignment
                });

                io.emit("orderStatusUpdated", populatedOrder);

                io.emit("riderStatusUpdated", {
                    riderId: selectedRider._id,
                    status: selectedRider.riderStatus,
                    activeOrderCount: selectedRider.activeOrderCount
                });
            }
        } catch (socketErr) {
            console.error("[Smart Match] ⚠️ Socket emit failed:", socketErr.message);
        }

        return true;

    } catch (error) {
        console.error("[Smart Match] ❌ Critical error during processing:", error);
        return false;
    }
};

module.exports = { autoAssignOrder };
