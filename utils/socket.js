const socketIo = require("socket.io")
const routingService = require("./routingService")

let io

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

        socket.on("disconnect", () => {
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
