const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { auth } = require('../middleware/auth');

// @route   POST /api/payment/create-intent
// @desc    Create a Stripe Payment Intent
// @access  Private
router.post('/create-intent', auth, async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        // Create a PaymentIntent with the order amount and currency
        // Stripe expects amounts in the smallest currency unit (e.g. cents for USD).
        // For PKR, Stripe expects standard integer amounts (e.g., Rs 100 = 100)
        // Wait, for PKR it technically expects amount * 100 if it supports minor units!
        // But let's check: Stripe PKR is a zero-decimal currency mathematically or 2-decimal?
        // Actually, Stripe PKR expects amounts in paisa (1/100 of PKR), so we multiply by 100.
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // PKR paisa
            currency: 'pkr',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Stripe Intent Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
