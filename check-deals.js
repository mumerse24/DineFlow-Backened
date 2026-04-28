const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/food-delivery";

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log("Connected to DB");
        const MenuItem = require('./models/MenuItem');
        const deals = await MenuItem.find({
            $or: [
                { isFeatured: true },
                { discountPercentage: { $gt: 0 } }
            ]
        });
        console.log("Deals found:", deals.length);
        if (deals.length > 0) {
            deals.forEach(d => console.log(`- ${d.name} (Featured: ${d.isFeatured}, Discount: ${d.discountPercentage})`));
        } else {
            console.log("No deals found. Checking all items...");
            const all = await MenuItem.find().limit(5);
            all.forEach(d => console.log(`- ${d.name} (Featured: ${d.isFeatured}, Discount: ${d.discountPercentage})`));
        }
        mongoose.disconnect();
    })
    .catch(err => {
        console.error("Error:", err);
        process.exit(1);
    });
