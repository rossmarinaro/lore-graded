"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = logout;
exports.syncUsers = syncUsers;
exports.submitOrderToQueue = submitOrderToQueue;
exports.checkout = checkout;
exports.webhook = webhook;
require('dotenv').config();
const database_1 = require("../database");
const notification_1 = require("../notification");
const utils_1 = require("../utils");
const stripe_1 = require("../stripe");
async function logout(_req, res) {
    try {
        res.clearCookie('session_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        res.redirect(302, process.env.WEB_URL);
    }
    catch (error) {
        console.error('logout::Error: ', error);
        res.status(500).send('Internal Server Error');
    }
}
async function syncUsers(req, res) {
    try {
        const { collection, documents } = req.body;
        if (!collection || !Array.isArray(documents)) {
            res.status(400).json({ error: `Invalid payload layout. 'collection' and 'documents' are required.` });
            return;
        }
        const dbCollection = database_1.Database.client.db(process.env.MONGODB_DATABASE).collection(collection);
        const bulkOps = documents.map(doc => {
            const sqlId = doc.metadata?.originalSqlId;
            if (sqlId !== undefined && sqlId !== null) {
                return {
                    updateOne: {
                        filter: { 'metadata.originalSqlId': sqlId },
                        update: { $set: doc },
                        upsert: true
                    }
                };
            }
            else
                return {
                    insertOne: { document: doc }
                };
        });
        if (bulkOps.length === 0) {
            res.json({ status: 'Success', message: 'No documents provided to write.' });
            return;
        }
        const result = await dbCollection.bulkWrite(bulkOps, { ordered: false });
        res.json({
            status: 'Success',
            matched: result.matchedCount,
            upserted: result.upsertedCount,
            inserted: result.insertedCount
        });
    }
    catch (err) {
        console.error('❌ Synchronization backend error:', err);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}
async function submitOrderToQueue(req, res) {
    console.log('submitOrder: ', req.body);
    if (!req._id) {
        console.error('submitOrderToQueue :: Denied - Unauthorized request or missing ID');
        res.status(401).send('Unauthorized.');
        return;
    }
    if (!req.body || !req.body.order_id) {
        console.error('submitOrderToQueue :: Denied - Missing order_id in request body');
        return res.status(400).send('Bad Request: order_id is required.');
    }
    try {
        const order = { order_id: req.body.order_id, time_stamp: new Date() };
        const projection = { email: 1, phone: 1 };
        const account = await database_1.Database.findOneAndUpdate(process.env.MONGODB_COLLECTION, { _id: (0, utils_1.getUserID)(req._id) }, { order }, projection);
        if (account) {
            (0, notification_1.sendNotification)(account, 'submit');
            res.redirect(302, `${process.env.WEB_URL}`);
        }
    }
    catch (error) {
        console.error('submitOrder::Error: ', error);
        res.status(500).send('Internal Server Error');
    }
}
async function checkout(req, res) {
    if (!req._id) {
        console.error('checkout :: Denied - req._id is undefined');
        return res.status(401).send('Unauthorized: User session missing.');
    }
    try {
        const projection = { email: 1, phone: 1 };
        const account = await database_1.Database.findOne(process.env.MONGODB_COLLECTION, { _id: (0, utils_1.getUserID)(req._id) }, projection);
        if (account) {
            const metadata = {
                recipient: req.body.recipient ?? null,
                email: account.email ?? null,
                phone: account.phone ?? null
            };
            const price = 100;
            const stripeSession = await stripe_1.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                success_url: `${process.env.WEB_URL}/checkout-success`,
                cancel_url: process.env.WEB_URL,
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: { name: 'loregraded' },
                            unit_amount: price,
                        },
                        quantity: 1
                    }
                ],
                metadata
            });
            console.log('Checkout Success Link Generated: ', stripeSession.url, '\nTotal: ', price, '\nMetadata: ', JSON.stringify(account));
            res.status(200).send(stripeSession.url);
        }
        else
            res.status(401).send('Please create an account before checking out.');
    }
    catch (error) {
        console.error('checkout::Error: ', error);
        res.status(500).send('Internal Server Error');
    }
}
async function webhook(req, res) {
    try {
        const event = req.body, webhookSession = JSON.parse(event.data.object.metadata[0]);
        switch (event.type) {
            case 'checkout.session.completed':
                const _id = webhookSession._id;
                const projection = { email: 1 };
                const account = await database_1.Database.findOneAndUpdate(process.env.MONGODB_COLLECTION, { _id }, projection, { paid: true });
                if (account) {
                    console.log(`user: ${account.email} paid. Sending notification.`);
                    (0, notification_1.sendNotification)(webhookSession, 'purchase.complete');
                }
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
                break;
        }
    }
    catch (error) {
        console.error('webhook::Error: ', error);
    }
    res.json({ received: true });
}
//# sourceMappingURL=main.js.map