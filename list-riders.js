const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./models/User');

async function listRiders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const riders = await User.find({ role: 'rider' });
        console.log(`Found ${riders.length} riders:`);
        riders.forEach(r => {
            console.log(`- ${r.name} (${r.email}), Phone: ${r.phone}, Status: ${r.riderStatus}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listRiders();
