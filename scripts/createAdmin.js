const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const User = require("../models/User")
require("dotenv").config()

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("Connected to MongoDB")

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL })
    if (existingAdmin) {
      console.log("Admin user already exists")
      process.exit(0)
    }

    // Create admin user
    const adminUser = new User({
      name: "Admin",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      phone: "+1234567890",
      role: "admin",
      isVerified: true,
      isActive: true,
    })

    await adminUser.save()
    console.log("Admin user created successfully")
    console.log(`Email: ${process.env.ADMIN_EMAIL}`)
    console.log(`Password: ${process.env.ADMIN_PASSWORD}`)

    process.exit(0)
  } catch (error) {
    console.error("Error creating admin:", error)
    process.exit(1)
  }
}

createAdmin()
