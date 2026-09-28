import { Request, Response } from 'express';
import { stripe } from './config/stripe.js'; // Ensure correct path extension for NodeNext
const express = require('express');
export const router = express.Router(); // 1. Create the mini-app


/**
 * POST /api/create-payment-intent
 * Core endpoint for processing card payments
 */
router.post('/create-payment-intent', async (req: Request, res: Response): Promise<void> => { 
  try {
    const { amount, currency } = req.body;

    // Basic validation
    if (!amount || !currency) {
      res.status(400).json({ error: 'Missing required fields: amount and currency' });
      return;
    }

    // Create a PaymentIntent with the order amount and currency
    // Note: Stripe processes amounts in the smallest currency unit (e.g., cents for USD)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      // Optional: automated payment methods handles credit cards, Apple Pay, etc.
      payment_method_types: ['card'], 
    });

    // Send the clientSecret back to the frontend to finalize the payment
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});



