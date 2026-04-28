const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/food-delivery";

async function listUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        const User = require("./models/User");
        const users = await User.find({}, "email name role phone");
        console.log("Users in DB:");
        console.log(JSON.stringify(users, null, 2));

        await mongoose.connection.close();
    } catch (err) {
        console.error("Error:", err);
    }
}

listUsers();
