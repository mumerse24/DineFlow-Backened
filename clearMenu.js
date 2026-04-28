const mongoose = require("mongoose");
const MenuItem = require("./models/MenuItem");
require("dotenv").config();

async function clearMenu() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            console.error("❌ MONGODB_URI missing in .env");
            process.exit(1);
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected.");

        console.log("Deleting all MenuItems...");
        const result = await MenuItem.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} items.`);

        process.exit(0);
    } catch (error) {
        console.error("Error clearing menu:", error);
        process.exit(1);
    }
}

clearMenu();
