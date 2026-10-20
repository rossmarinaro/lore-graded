"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketplaceOnboard = marketplaceOnboard;
require('dotenv').config();
const stripe_1 = require("../stripe");
async function marketplaceOnboard(req, res) {
    try {
        const { email, country } = req.body;
        const account = await stripe_1.stripe.accounts.create({
            type: 'express',
            country: country || 'US',
            email: email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        });
        const accountLink = await stripe_1.stripe.accountLinks.create({
            account: account.id,
            refresh_url: 'https://yourmarketplace.com',
            return_url: 'https://yourmarketplace.com',
            type: 'account_onboarding',
        });
        res.json({ url: accountLink.url });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=marketplace.js.map