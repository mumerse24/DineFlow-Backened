const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/food-delivery', { useNewUrlParser: true }).then(async () => {
    const db = mongoose.connection.db;
    const items = await db.collection('menuitems').find().sort({ _id: -1 }).limit(5).toArray();
    console.log(JSON.stringify(items, null, 2));
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
