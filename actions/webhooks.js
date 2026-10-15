"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutPaymentHook = checkoutPaymentHook;
exports.gamePaymentHook = gamePaymentHook;
const database_1 = require("../database");
const notification_1 = require("../notification");
const stripe_1 = require("../stripe");
async function checkoutPaymentHook(req, res) {
    try {
        const event = req.body, webhookSession = JSON.parse(event.data.object.metadata[0]);
        const _id = webhookSession._id;
        const projection = { email: 1 };
        switch (event.type) {
            case 'checkout.session.completed':
                {
                    const account = await database_1.Database.findOneAndUpdate(process.env.MONGODB_COLLECTION, { _id }, projection, { paid: true });
                    if (account) {
                        console.log(`user: ${account.email} paid. Sending notification.`);
                        const to = (0, notification_1.sendNotification)(webhookSession, 'purchase.complete');
                        console.log('Successfully sent notifications to: ', to);
                    }
                }
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
                break;
        }
    }
    catch (error) {
        console.error('checkoutPaymentHook::Error: ', error);
    }
    res.json({ received: true });
}
async function gamePaymentHook(req, res) {
    try {
        const event = req.body, webhookSession = JSON.parse(event.data.object.metadata[0]);
        const _id = webhookSession._id;
        const projection = { email: 1 };
        const session = event.data.object;
        const lineItems = await stripe_1.stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product'],
        });
        const itemsPayload = lineItems.data.map(item => {
            const product = item.price?.product;
            return {
                itemId: product.metadata?.databaseId || item.price?.id,
                stripeProductId: product.id,
                name: item.description,
                quantity: item.quantity || 1,
                amountCents: item.amount_total,
            };
        });
        console.log('items payload: ', itemsPayload);
        switch (event.type) {
            case 'checkout.session.completed':
                {
                    const account = await database_1.Database.findOneAndUpdate(process.env.MONGODB_COLLECTION, { _id }, projection, { paid: true });
                    if (account) {
                        console.log(`user: ${account.email} paid. Sending notification.`);
                        (0, notification_1.sendNotification)(webhookSession, 'purchase.complete');
                    }
                }
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
                break;
        }
    }
    catch (error) {
        console.error('gamePaymentHook::Error: ', error);
    }
    res.json({ received: true });
}
//# sourceMappingURL=webhooks.js.map