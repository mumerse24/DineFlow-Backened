const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
require("dotenv").config();

async function testAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find an admin
        const admin = await User.findOne({ role: { $in: ["admin", "superadmin"] } });
        if (!admin) {
            console.log("No admin found in User collection!");
            process.exit(1);
        }
        console.log("Found admin:", admin.email, "Role:", admin.role);

        // Generate token
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Use fetch to call /admin/dashboard
        const res = await fetch("http://localhost:5000/api/admin/dashboard", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await res.json();
        console.log("Dashboard response:", res.status, data);

        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

testAdmin();
