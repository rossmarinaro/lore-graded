"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = logout;
exports.syncUser = syncUser;
exports.submitOrderToQueue = submitOrderToQueue;
exports.purchaseGames = purchaseGames;
require('dotenv').config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database");
const notification_1 = require("../notification");
const utils_1 = require("../utils");
async function logout(_req, res) {
    try {
        res.clearCookie('session_id', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none'
        });
        res.redirect(302, process.env.WEB_URL);
    }
    catch (error) {
        console.error('logout::Error: ', error);
        res.status(500).send('Internal Server Error');
    }
}
async function syncUser(req, res) {
    const { syncToken } = req.body;
    try {
        if (!process.env.CROSS_SERVICE_SECRET)
            throw new Error('CROSS_SERVICE_SECRET is not defined.');
        console.log('Syncing user...');
        const decoded = jsonwebtoken_1.default.verify(syncToken, process.env.CROSS_SERVICE_SECRET);
        const user = await database_1.Database.findOneAndUpdate(process.env.MONGODB_COLLECTION, { email: decoded.email }, {}, {}, true);
        if (!user) {
            res.status(401).json({ error: 'Problem accessing database.' });
            return;
        }
        const renderSessionToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.CROSS_SERVICE_SECRET, { expiresIn: '30d' });
        console.log('Issuing new token: ', renderSessionToken);
        const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
        res.cookie('session_id', renderSessionToken, {
            domain: isProd ? '.loregraded.com' : undefined,
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/'
        }).status(200);
        res.status(200).json({ success: true, token: renderSessionToken });
    }
    catch (error) {
        res.status(401).json({ error: 'Tampered or expired cross-service token' });
    }
}
async function submitOrderToQueue(req, res) {
    const { user_id, order_id, queue_timestamp, phone, recipient, street, apartment, city, zip, state, country } = req.body;
    if (!user_id || !order_id) {
        console.error('submitOrderToQueue :: Denied - Missing user_id or order_id in request body');
        return res.status(400).send('Bad Request: user_id and order_id are required.');
    }
    else
        console.log('Submitting order: ', order_id);
    try {
        const sqlQuery = '';
        const queryValues = ['active'];
        const sqlResult = await database_1.sqlPool.query(sqlQuery, queryValues);
        const products = sqlResult.rows;
        if (!products) {
            console.log('Product not found.');
            return;
        }
        const line_items = [];
        products.forEach(i => {
            line_items.push({
                price_data: {
                    currency: i.currency,
                    product_data: {
                        name: i.id,
                        metadata: {}
                    },
                    unit_amount: i.price
                },
                quantity: 1
            });
        });
        const order = { user_id, order_id, line_items, time_stamp: queue_timestamp };
        const id = req.id?.toString();
        if (!id)
            return;
        const updateParams = { phone, recipient, street, apartment, city, zip, state, country, order };
        const projection = { email: 1, phone: 1 };
        const account = await database_1.Database.findOneAndUpdate(process.env.MONGODB_COLLECTION, { _id: (0, utils_1.getUserID)(id) }, updateParams, projection);
        if (account) {
            res.status(200).send(`Order ${order_id} added to the queue.`);
            const to = await (0, notification_1.sendNotification)(account, 'submit');
            console.log('Successfully sent notifications to: ', to);
        }
        else {
            console.log('Failed to associate order to queue.');
            res.status(302).send('Failed to associate account with order queue.');
        }
    }
    catch (error) {
        console.error('submitOrder::Error: ', error);
        res.status(500).send('Internal Server Error');
    }
}
async function purchaseGames(req, res) {
    console.log('purchaseGames: ', req.body);
    if (!req.id) {
        console.error('purchaseGames :: Denied - Unauthorized request or missing ID');
        res.status(401).send('Unauthorized.');
        return;
    }
    const { castleWar, sovereignHeist, shardDuel, order_id } = req.body;
    if (!order_id || !castleWar || !sovereignHeist || !shardDuel) {
        console.error('purchaseGames :: Denied - Missing order_id in request body');
        return res.status(400).send('Bad Request: order_id is required.');
    }
    try {
    }
    catch (error) {
        console.error('purchaseGames::Error: ', error);
        res.status(500).send('Internal Server Error');
    }
}
//# sourceMappingURL=main.js.map