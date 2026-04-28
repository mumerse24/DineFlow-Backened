const express = require("express");
const MenuItem = require("../models/MenuItem");

const router = express.Router();

// 🧠 Rule-Based Brain (Dictionary of Keywords)
const knowledgeBase = [
  { keywords: ["hi", "hello", "hey", "greetings", "salam"], response: "Hello there! 👋 I'm your food assistant. Ask me about our burgers, pizzas, deals, or delivery times!" },
  { keywords: ["burger", "burgers", "bgr", "bggr", "beef", "chicken burger"], response: "We have amazing Burgers! 🍔 Our Beef Burger Bites and freshly toasted Vegies Burger are fan favorites." },
  { keywords: ["pizza", "pizzas"], response: "Craving Pizza? 🍕 You must try our Crown Crust Pizza. It goes perfectly with our deals!" },
  { keywords: ["deal", "deals", "discount", "offer", "combo"], response: "We have incredible Combo Deals starting from Rs. 999. They include drinks, fries, and burgers! Check the 'Special Deals' tab." },
  { keywords: ["time", "delivery", "late", "eta", "when"], response: "Delivery typically takes 30-45 minutes. 🛵 You will see an exact AI-calculated time at checkout!" },
  { keywords: ["fries", "chips", "sides", "nugget", "nagget"], response: "Our crispy fries and 8-piece Nuggets are incredibly delicious! You can find them under the 'Sides' category. 🍟" },
  { keywords: ["salad", "healthy", "vegan", "veg"], response: "For a lighter option, try our Special Vegan Salad or our tasty Vegies Burger! 🌱" },
  { keywords: ["drink", "drinks", "pepsi", "coke", "soda"], response: "You can grab a refreshing cold drink like Pepsi. It's automatically included in most of our Combo Deals!" },
  { keywords: ["price", "cost", "expensive", "cheap"], response: "Our menu is highly affordable! Sides start around Rs. 200, Burgers are Rs. 350-600, and large Pizzas are Rs. 2150." },
  { keywords: ["halal"], response: "Yes, absolutely! All of the meat processing and cooking in our kitchen is 100% Halal certified. 🥩" },
  { keywords: ["pay", "payment", "card", "cash", "credit"], response: "We accept Cash on Delivery and all major Credit/Debit cards securely processed via Stripe! 💳" },
  { keywords: ["track", "status", "gps", "where"], response: "Once you place an order, you can watch the Rider arrive live via our integrated GPS tracking map! 🗺️" },
  { keywords: ["thank", "thanks", "thx"], response: "You're very welcome! Enjoy your meal and feel free to ask if you need anything else! 😊" }
];

const defaultResponse = "I'm still learning! 😅 I can mostly help you with our menu items like burgers, pizzas, special deals, prices, and delivery times. What would you like to know?";

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const userMessage = message.toLowerCase();
    let bestReply = defaultResponse;

    // Fast O(N) lookup against the knowledge base
    for (const rule of knowledgeBase) {
      // Check if any keyword exists in the user's message
      const matchFound = rule.keywords.some(keyword => userMessage.includes(keyword));
      if (matchFound) {
        bestReply = rule.response;
        break; // Stop at the first valid rule match
      }
    }

    // A tiny delay to simulate "thinking" to make it feel human
    setTimeout(() => {
      return res.json({ reply: bestReply });
    }, 600);

  } catch (error) {
    console.error("Rule Chat Error:", error);
    return res.status(500).json({ error: "Failed to process chat response" });
  }
});

module.exports = router;
