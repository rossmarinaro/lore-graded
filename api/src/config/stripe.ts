import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY is missing from environment variables');
}

// Initialize Stripe with the recommended API version config
export const stripe = new Stripe(secretKey, {
  apiVersion: '2026-08-26.dahlia', // Best practice: lock this to a specific version
});
