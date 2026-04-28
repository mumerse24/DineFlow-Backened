const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/food-delivery";

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log("Connected to DB");
        const MenuItem = require('./models/MenuItem');

        // Mark first 2 items as featured and with discount
        const items = await MenuItem.find().limit(5);

        if (items.length > 0) {
            for (let i = 0; i < Math.min(items.length, 3); i++) {
                items[i].isFeatured = true;
                items[i].discountPercentage = 10 + (i * 5);
                items[i].originalPrice = items[i].price + 50;
                await items[i].save();
                console.log(`Updated: ${items[i].name} as a deal.`);
            }
        } else {
            console.log("No items found to update.");
        }

        mongoose.disconnect();
    })
    .catch(err => {
        console.error("Error:", err);
        process.exit(1);
    });
