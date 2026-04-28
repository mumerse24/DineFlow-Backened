const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const Admin = require("../models/Admin")
require("dotenv").config()

async function createlogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ Connected to MongoDB")

    const existingAdmin = await Admin.findOne({
      email: "admin@foodexpress.com"
    })

    if (existingAdmin) {
      console.log("⚠️ Admin already exists!")
      console.log("📧 Email:", existingAdmin.email)
      return process.exit(0)
    }

    const hashedPassword = await bcrypt.hash("admin123", 10)

    const admin = new Admin({
      email: "admin@foodexpress.com",
      password: hashedPassword,
      name: "System Administrator",
      role: "superadmin"
    })

    await admin.save()

    console.log("✅ Admin created successfully!")
    console.log("📧 Email: admin@foodexpress.com")
    console.log("🔑 Password: 123456")
    console.log("🎭 Role: superadmin")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error creating admin:", error)
    process.exit(1)
  }
}

// Wrap call in async IIFE
; (async () => {
  await createlogin()
})()
