require('dotenv').config();

import { Request, Response } from 'express'
import { stripe } from '../stripe';

export async function marketplaceOnboard(req: Request, res: Response)
{
  // Endpoint to register a new vendor and get an onboarding link

  try {
    const { email, country } = req.body;

    // 1. Create the Connected Account in Stripe
    const account = await stripe.accounts.create({
      type: 'express',
      country: country || 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }, // Needed to route funds to the vendor
      },
    });

    // Save account.id to your local database associated with this vendor user

    // 2. Generate a Stripe-hosted account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://yourmarketplace.com',
      return_url: 'https://yourmarketplace.com',
      type: 'account_onboarding',
    });

    // Send the dynamic URL to your frontend so the user can be redirected to Stripe
    res.json({ url: accountLink.url });
  } 
  catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}