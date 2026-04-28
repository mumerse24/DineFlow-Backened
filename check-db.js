const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/food-delivery";

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log("Connected to DB");
        const Restaurant = require('./models/Restaurant');
        const restaurant = await Restaurant.findById("6973975518858a5d42961807");
        console.log("Restaurant found:", restaurant ? "YES" : "NO");

        // Let's also check if there are ANY restaurants
        const count = await Restaurant.countDocuments();
        console.log("Total restaurants in DB:", count);

        if (count > 0 && !restaurant) {
            const first = await Restaurant.findOne();
            console.log("First restaurant ID:", first._id.toString());
        }

        mongoose.disconnect();
    })
    .catch(err => {
        console.error("Error:", err);
        process.exit(1);
    });
