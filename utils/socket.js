const socketIo = require("socket.io")
const routingService = require("./routingService")

let io
const riderLocations = new Map(); // Store last known position per orderId

const initSocket = (server) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]

    io = socketIo(server, {
        cors: {
            origin: (origin, callback) => callback(null, true),
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            credentials: true,
        },
    })

    io.on("connection", (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`)

        // 💬 IN-APP CHAT LOGIC
        socket.on("joinOrderChat", (orderId) => {
            socket.join(`chat_${orderId}`);
            console.log(`💬 User ${socket.id} joined chat room: chat_${orderId}`);
        });

        // 👥 GROUP ORDER LOGIC
        socket.on("joinGroupOrder", (inviteCode) => {
            socket.join(`group_${inviteCode}`);
            console.log(`👥 User ${socket.id} joined group order room: group_${inviteCode}`);
        });

        socket.on("joinUser", (userId) => {
            socket.join(`user_${userId}`);
            console.log(`👤 User ${socket.id} joined personal room: user_${userId}`);
        });

        socket.on("sendMessage", async (data) => {
            try {
                const { orderId, senderId, text } = data;
                const Message = require("../models/Message");

                // 1. Save to Database
                const newMessage = new Message({
                    order: orderId,
                    sender: senderId,
                    text
                });
                await newMessage.save();

                // 2. Populate and Broadcast to the specific order room
                const populatedMessage = await Message.findById(newMessage._id).populate("sender", "name role");

                io.to(`chat_${orderId}`).emit("newMessage", populatedMessage);
                console.log(`✉️ Message sent in room chat_${orderId}`);
            } catch (err) {
                console.error("Socket sendMessage error:", err.message);
            }
        });

        // 📍 LIVE TRACKING LOGIC
        socket.on("riderJoinOrder", (orderId) => {
            socket.join(`track_${orderId}`);
            socket.orderId = orderId; // Attach for disconnect cleanup
            console.log(`🛵 Rider ${socket.id} joined tracking room: track_${orderId}`);
        });

        socket.on("customerJoinOrder", (orderId) => {
            socket.join(`track_${orderId}`);
            console.log(`🏠 Customer ${socket.id} joined tracking room: track_${orderId}`);
            
            // Send last known position immediately if exists
            if (riderLocations.has(orderId)) {
                socket.emit("riderLocationUpdate", riderLocations.get(orderId));
            }
        });

        socket.on("updateRiderLocation", (data) => {
            const { orderId, lat, lng, bearing, speed, timestamp } = data;
            
            // 1. Update In-Memory Cache
            const locationUpdate = { lat, lng, bearing, speed, timestamp, orderId };
            riderLocations.set(orderId, locationUpdate);

            // 2. Broadcast to all in the tracking room (including the customer)
            io.to(`track_${orderId}`).emit("riderLocationUpdate", locationUpdate);
            console.log(`📍 Location update for order ${orderId}`);
        });

        socket.on("disconnect", () => {
            if (socket.orderId) {
                // Notify customer that rider went offline
                io.to(`track_${socket.orderId}`).emit("riderOffline", { 
                    orderId: socket.orderId,
                    lastSeen: new Date()
                });
            }
            console.log(`🔌 Client disconnected: ${socket.id}`)
        })
    })

    return io
}

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!")
    }
    return io
}

module.exports = { initSocket, getIO }
