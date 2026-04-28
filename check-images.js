const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("Connected to MongoDB");
        const items = await MenuItem.find().sort({ createdAt: -1 }).limit(5);
        items.forEach(item => {
            console.log(`\nName: ${item.name}`);
            console.log(`Images:`, item.images);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
