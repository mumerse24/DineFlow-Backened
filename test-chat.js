const { io } = require("socket.io-client");
const mongoose = require("mongoose");
const orderId = "69c67cb2376999216491e346";

// Let's connect to the running socket server
const socket = io("http://localhost:5000", {
    transports: ["websocket", "polling"],
});

socket.on("connect", () => {
    console.log("Connected with id", socket.id);
    
    socket.emit("joinOrderChat", orderId);
    console.log("Emitted joinOrderChat");
    
    setTimeout(() => {
        socket.emit("sendMessage", {
            orderId: orderId,
            senderId: new mongoose.Types.ObjectId().toString(), // fake sender ID
            text: "Hello from test script"
        });
        console.log("Emitted sendMessage");
    }, 1000);
});

socket.on("newMessage", (data) => {
    console.log("Received newMessage:", JSON.stringify(data, null, 2));
    process.exit(0);
});

socket.on("connect_error", (err) => {
    console.error("Connection error:", err.message);
    process.exit(1);
});

setTimeout(() => {
    console.log("Timeout waiting for message");
    process.exit(1);
}, 5000);
