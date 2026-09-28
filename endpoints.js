"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const stripe_js_1 = require("./config/stripe.js");
const express = require('express');
exports.router = express.Router();
exports.router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency } = req.body;
        if (!amount || !currency) {
            res.status(400).json({ error: 'Missing required fields: amount and currency' });
            return;
        }
        const paymentIntent = await stripe_js_1.stripe.paymentIntents.create({
            amount: amount,
            currency: currency,
            payment_method_types: ['card'],
        });
        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    }
    catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});
//# sourceMappingURL=endpoints.js.map