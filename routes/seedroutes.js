const express = require("express")
const mongoose = require("mongoose")
const MenuItem = require("../models/MenuItem")
const Restaurant = require("../models/Restaurant")

const router = express.Router()

// @route   POST /api/seed/restaurant
// @desc    Create test restaurant with menu items
// @access  Public (for testing)
router.get("/restaurant", async (req, res) => {
    try {
        console.log("Seeding restaurant and menu items...")

        // Delete existing test restaurant if exists
        await Restaurant.deleteMany({ name: { $regex: /Test Restaurant|Delicious Food/i } })
        await MenuItem.deleteMany({
            name: {
                $in: [
                    "Chicken Burger",
                    "Pepperoni Pizza",
                    "French Fries",
                    "Caesar Salad",
                    "Mango Lassi",
                    "Chocolate Brownie"
                ]
            }
        })

        // Create restaurant with ALL required fields
        const restaurant = new Restaurant({
            name: "Delicious Food Restaurant",
            email: "contact@deliciousfood.com",
            phone: "03001234567",
            description: "Best restaurant in town with delicious food",
            openingHours: "9 AM - 11 PM",
            cuisines: ["Fast Food", "Italian", "Pakistani"],
            deliveryTime: "30-45 minutes",

            // Address with all required fields
            address: {
                street: "123 Food Street",
                city: "Karachi",
                state: "Sindh",
                zipCode: "75500",
                coordinates: {
                    lat: 32.5742,
                    lng: 74.0754
                }
            },

            // Business info with required fields
            businessInfo: {
                taxId: "TAX-123456789",
                licenseNumber: "LIC-987654321",
                businessType: "Restaurant",
                registrationDate: new Date("2023-01-01")
            },

            // Owner info (required field)
            owner: new mongoose.Types.ObjectId("65d5f8a9c1b8f4a1f8c7b6a2"),

            images: {
                logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
                banner: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
                gallery: [
                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
                ]
            },

            // Social links (optional but good to have)
            socialLinks: {
                facebook: "https://facebook.com/deliciousfood",
                instagram: "https://instagram.com/deliciousfood"
            },

            // Settings
            settings: {
                isAcceptingOrders: true,
                autoAcceptOrders: true,
                notificationEnabled: true
            },

            isActive: true,
            isVerified: true,
            rating: 4.5,
            totalReviews: 120,
            minimumOrder: 500,
            deliveryFee: 100,
            preparationTime: 20,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        await restaurant.save()
        console.log("✅ Restaurant created:", restaurant._id)

        // Create menu items
        const menuItems = [
            {
                name: "Chicken Burger",
                description: "Juicy chicken patty with fresh vegetables and special sauce",
                price: 550,
                images: ["https://img.freepik.com/free-photo/big-sandwich-hamburger-with-juicy-beef-burger-cheese-tomato-red-onion-wooden-table_2829-19631.jpg?w=800"],
                category: "Burgers",
                restaurant: restaurant._id,
                isAvailable: true,
            },
            {
                name: "Pepperoni Pizza",
                description: "Classic pizza with pepperoni and extra cheese",
                price: 1200,
                images: ["https://img.freepik.com/free-photo/top-view-pepperoni-pizza-with-mushroom-sausages-bell-pepper-olive-corn-black-wooden_141793-2158.jpg?w=800"],
                category: "Pizza",
                restaurant: restaurant._id,
                isAvailable: true,
            },
            {
                name: "French Fries",
                description: "Crispy golden fries served with ketchup",
                price: 250,
                images: ["https://img.freepik.com/free-photo/french-fries-ketchup_1205-113.jpg?w=800"],
                category: "Sides",
                restaurant: restaurant._id,
                isAvailable: true,
            },
            {
                name: "Chicken Chow Mein",
                description: "Stir-fried noodles with chicken and vegetables",
                price: 750,
                images: ["https://img.freepik.com/free-photo/chow-mein-noodles-with-chicken-vegetables_1203-3570.jpg?w=800"],
                category: "Chinese",
                restaurant: restaurant._id,
                isAvailable: true,
            },
            {
                name: "Caesar Salad",
                description: "Fresh romaine lettuce with Caesar dressing and croutons",
                price: 450,
                images: ["https://img.freepik.com/free-photo/top-view-vegetable-salad-with-fork-dark-desk_140725-101785.jpg?w=800"],
                category: "Salads",
                restaurant: restaurant._id,
                isAvailable: true,
            },
            {
                name: "Mango Lassi",
                description: "Refreshing yogurt-based mango drink",
                price: 200,
                images: ["https://img.freepik.com/free-photo/glass-mango-lassi-with-mint-leaves_1150-23456.jpg?w=800"],
                category: "Beverages",
                restaurant: restaurant._id,
                isAvailable: true,
            }
        ]

        const createdItems = await MenuItem.insertMany(menuItems)
        console.log("✅ Menu items created:", createdItems.length)

        res.json({
            success: true,
            message: "Test restaurant and menu items created successfully",
            data: {
                restaurantId: restaurant._id,
                restaurantName: restaurant.name,
                menuItemsCount: createdItems.length,
                restaurantEmail: restaurant.email,
                restaurantPhone: restaurant.phone
            }
        })

    } catch (error) {
        console.error("❌ Seed error:", error)
        res.status(500).json({
            success: false,
            message: "Server error during seeding",
            error: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        })
    }
})

// SIMPLE SEED - Without strict validation
// @route   POST /api/seed/simple
// @desc    Create simple test restaurant
// @access  Public
router.get("/simple", async (req, res) => {
    try {
        console.log("Creating simple restaurant...")

        // Create a simple restaurant without all required fields
        const restaurant = new Restaurant({
            name: "Quick Bites Restaurant",
            email: "quick@bites.com",
            phone: "03009876543",
            description: "Quick and delicious meals",

            // Minimal address
            address: {
                street: "456 Fast Lane",
                city: "Lahore",
                state: "Punjab",
                zipCode: "54000",
                coordinates: {
                    lat: 31.5204,
                    lng: 74.3587
                }
            },

            // Minimal business info
            businessInfo: {
                taxId: "TAX-SIMPLE-001",
                licenseNumber: "LIC-SIMPLE-001"
            },

            owner: new mongoose.Types.ObjectId(),

            images: {
                logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
            },

            isActive: true,
            isVerified: false
        })

        await restaurant.save()

        // Create 3 simple menu items
        const menuItems = [
            {
                name: "Cheese Burger",
                description: "Classic cheese burger",
                price: 450,
                images: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600"],
                category: "Burgers",
                restaurant: restaurant._id,
                isAvailable: true
            },
            {
                name: "French Fries",
                description: "Crispy fries",
                price: 180,
                images: ["https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600"],
                category: "Sides",
                restaurant: restaurant._id,
                isAvailable: true
            },
            {
                name: "Soft Drink",
                description: "Cold beverage",
                price: 120,
                images: ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600"],
                category: "Beverages",
                restaurant: restaurant._id,
                isAvailable: true
            }
        ]

        const createdItems = await MenuItem.insertMany(menuItems)

        res.json({
            success: true,
            message: "Simple restaurant created",
            restaurantId: restaurant._id,
            restaurantName: restaurant.name,
            itemsCount: createdItems.length
        })

    } catch (error) {
        console.error("Simple seed error:", error)
        res.status(500).json({
            success: false,
            message: "Simple seed failed",
            error: error.message
        })
    }
})

// @route   POST /api/seed/menu-items
// @desc    Seed menu items with example data (Zinger Burger, Chicken Pizza, etc.)
// @access  Public (development use)
router.get("/menu-items", async (req, res) => {
    try {
        console.log("🌱 Seeding menu items...")

        // Find an existing restaurant OR create one for the seed items
        let restaurant = await Restaurant.findOne({ isActive: true })

        if (!restaurant) {
            console.log("No restaurant found, creating one for seed data...")
            restaurant = new Restaurant({
                name: "Food Delivery Restaurant",
                email: "info@fooddelivery.com",
                phone: "03001234567",
                description: "Delicious food delivered to your door",
                address: {
                    street: "1 Main Street",
                    city: "Karachi",
                    state: "Sindh",
                    zipCode: "75500",
                    coordinates: { lat: 32.5742, lng: 74.0754 }
                },
                businessInfo: {
                    taxId: "TAX-SEED-001",
                    licenseNumber: "LIC-SEED-001",
                    businessType: "Restaurant",
                    registrationDate: new Date("2023-01-01")
                },
                owner: new mongoose.Types.ObjectId(),
                images: {
                    logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
                    banner: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
                    gallery: []
                },
                isActive: true,
                isVerified: true,
                rating: 4.5,
                totalReviews: 50,
                minimumOrder: 300,
                deliveryFee: 100,
                preparationTime: 20,
                cuisines: ["Fast Food", "Italian", "Pakistani"],
                deliveryTime: "30-45 minutes",
                openingHours: "9 AM - 11 PM",
                settings: { isAcceptingOrders: true, autoAcceptOrders: true }
            })
            await restaurant.save()
            console.log("✅ Restaurant created:", restaurant._id)
        } else {
            console.log("✅ Using existing restaurant:", restaurant._id, restaurant.name)
        }

        // Sample menu items - matching user's requirements exactly
        const sampleMenuItems = [
            {
                name: "Zinger Burger",
                description: "Crispy chicken burger with special zinger sauce and fresh lettuce",
                price: 450,
                category: "Burgers",
                images: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600"],
                restaurant: restaurant._id,
                isAvailable: true,
                preparationTime: "15-20 mins",
                isPopular: true,
            },
            {
                name: "Chicken Pizza",
                description: "Cheesy pizza topped with grilled chicken and fresh vegetables",
                price: 900,
                category: "Pizza",
                images: ["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600"],
                restaurant: restaurant._id,
                isAvailable: true,
                preparationTime: "20-25 mins",
                isPopular: true,
            },
            {
                name: "Beef Burger",
                description: "Juicy beef patty with cheese, lettuce, tomato and pickles",
                price: 550,
                category: "Burgers",
                images: ["https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600"],
                restaurant: restaurant._id,
                isAvailable: true,
                preparationTime: "15-20 mins",
            },
            {
                name: "Pepperoni Pizza",
                description: "Classic pepperoni pizza with extra cheese and tomato sauce",
                price: 1100,
                category: "Pizza",
                images: ["https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600"],
                restaurant: restaurant._id,
                isAvailable: true,
                preparationTime: "20-25 mins",
            },
            {
                name: "French Fries",
                description: "Golden crispy fries served with ketchup and mayo",
                price: 250,
                category: "Sides",
                images: ["https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600"],
                restaurant: restaurant._id,
                isAvailable: true,
                preparationTime: "10-15 mins",
            },
            {
                name: "Chicken Chow Mein",
                description: "Stir-fried noodles with chicken and fresh vegetables",
                price: 750,
                category: "Chinese",
                images: ["https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600"],
                restaurant: restaurant._id,
                isAvailable: true,
                preparationTime: "15-20 mins",
            },
            {
                name: "Mango Lassi",
                description: "Refreshing yogurt-based mango drink",
                price: 200,
                category: "Beverages",
                images: ["https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600"],
                restaurant: restaurant._id,
                isAvailable: true,
                preparationTime: "5-10 mins",
            },
            {
                name: "Chocolate Brownie",
                description: "Warm fudgy brownie served with vanilla ice cream",
                price: 350,
                category: "Desserts",
                images: ["https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600"],
                restaurant: restaurant._id,
                isAvailable: true,
                preparationTime: "5-10 mins",
            },
        ]

        // Check which items already exist to avoid duplicates
        const existingNames = await MenuItem.find({
            name: { $in: sampleMenuItems.map(i => i.name) },
            restaurant: restaurant._id
        }).distinct("name")

        const newItems = sampleMenuItems.filter(item => !existingNames.includes(item.name))

        let insertedCount = 0
        if (newItems.length > 0) {
            await MenuItem.insertMany(newItems)
            insertedCount = newItems.length
            console.log(`✅ Inserted ${insertedCount} new menu items`)
        } else {
            console.log("✅ All menu items already exist, skipping insert")
        }

        res.json({
            success: true,
            message: insertedCount > 0
                ? `${insertedCount} menu items seeded successfully`
                : "Menu items already exist — no duplicates inserted",
            data: {
                restaurantId: restaurant._id,
                restaurantName: restaurant.name,
                newItemsInserted: insertedCount,
                skippedItems: existingNames.length,
                totalSampleItems: sampleMenuItems.length,
            }
        })
    } catch (error) {
        console.error("❌ Menu items seed error:", error)
        res.status(500).json({
            success: false,
            message: "Failed to seed menu items",
            error: error.message,
        })
    }
})

// @route   POST /api/seed/rider
// @desc    Create or update a test rider account
// @access  Public
router.get("/rider", async (req, res) => {
    try {
        const User = require("../models/User")
        const bcrypt = require("bcryptjs")

        const { email = "rider@test.com", password = "password123", name = "Test Rider" } = req.body

        let rider = await User.findOne({ email })

        if (rider) {
            rider.role = "rider"
            rider.riderStatus = "available"
            if (req.body.password) {
                const salt = await bcrypt.genSalt(10)
                rider.password = await bcrypt.hash(req.body.password, salt)
            }
            await rider.save()
            console.log("✅ Rider updated:", email)
        } else {
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)
            
            rider = new User({
                name,
                email,
                password: hashedPassword,
                phone: "03111111111",
                role: "rider",
                riderStatus: "available",
                isActive: true,
                address: {
                    street: "Rider Base 1",
                    city: "Karachi",
                    state: "Sindh",
                    zipCode: "75500"
                }
            })
            await rider.save()
            console.log("✅ Rider created:", email)
        }

        res.json({
            success: true,
            message: `Rider account ${rider.email} is ready with role: rider`,
            data: {
                email: rider.email,
                role: rider.role,
                status: rider.riderStatus
            }
        })
    } catch (error) {
        console.error("Rider seed error:", error)
        res.status(500).json({ success: false, message: error.message })
    }
})

module.exports = router
