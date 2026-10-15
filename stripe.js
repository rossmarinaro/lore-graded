"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
exports.checkout = checkout;
const stripe_1 = __importDefault(require("stripe"));
exports.stripe = new stripe_1.default(process.env.STRIPE_PRIVATE_KEY, { apiVersion: '2026-08-26.dahlia' });
async function checkout(metadata, line_items, success_url, cancel_url = success_url) {
    try {
        const stripeSession = await exports.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url,
            cancel_url,
            metadata,
            line_items
        });
        console.log('Checkout Success Link Generated: ', stripeSession.url, '\nMetadata: ', JSON.stringify(metadata));
        return stripeSession.url;
    }
    catch (error) {
        console.error('checkout::Error: ', error);
    }
}
//# sourceMappingURL=stripe.js.map