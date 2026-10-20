"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
exports.sendTargetedNotifications = sendTargetedNotifications;
const nodemailer_1 = __importDefault(require("nodemailer"));
const database_1 = require("./database");
const stripe_1 = require("./stripe");
async function sendNotification(account, contextType, stripeUrl = '') {
    const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    try {
        let subject, html;
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: isProd ? 465 : 587,
            secure: isProd,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: { rejectUnauthorized: false }
        });
        switch (contextType) {
            case 'submit':
                subject = 'Submission Complete';
                html = `<img src="${process.env.LOGO_IMG}" alt="Company Logo" width="200" height="100">
                    <b><p>Thank you for your purchase. You will be added to the queue and notified if you've been selected.</p></b>`;
                break;
            case 'purchase.offered':
                {
                    subject = 'You Have Been Selected!';
                    html = `<img src="${process.env.LOGO_IMG}" alt="Company Logo" width="200" height="100">
                    <b>
                        <p>Congratulations, you have been selected for the Sunday card grading drop. Please click the button below to complete your checkout:</p>
                        <a href="${stripeUrl}" style="background-color: #635bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Pay Now</a>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p><a href="${stripeUrl}">${stripeUrl}</a></p>
                    </b>`;
                }
                break;
            case 'purchase.complete':
                subject = 'Purchase Complete';
                html = `<img src="${process.env.LOGO_IMG}" alt="Company Logo" width="200" height="100">
                    <b>
                        <p>
                            order details:
                        </p>
                    </b>`;
                break;
            default: {
                console.log('cannot send email or SMS - context not found.');
                return;
            }
        }
        const email = {
            from: `"LOREGRADED" <${process.env.SMTP_USER}>`,
            to: account.email,
            subject,
            html,
        }, info = await transporter.sendMail(email);
        console.log('email sent to: ', info.envelope.to);
        const SMS = '';
        return { email: email.to, phone: SMS };
    }
    catch (err) {
        console.log('error automated email/sms: ', err);
    }
}
async function sendTargetedNotifications() {
    const accounts = await database_1.Database.findAll(process.env.MONGODB_COLLECTION, -1);
    let totalOrders = 0;
    const totalAllowedOrders = 50;
    const selectedAccounts = [];
    accounts.forEach(i => {
        if ((i.orders && i.orders.length) && totalOrders + i.orders.length < totalAllowedOrders) {
            selectedAccounts.push(i);
            const lastOrder = i.orders.at(-1);
            if (lastOrder)
                totalOrders += lastOrder?.line_items.length;
        }
    });
    selectedAccounts.forEach(async (account) => {
        if (!account.orders || !account.orders.length)
            return;
        const lastOrder = account.orders.at(-1);
        if (!lastOrder) {
            console.log('No order found.');
            return;
        }
        const metadata = {
            user_id: lastOrder.user_id,
            order_id: lastOrder.order_id,
            time_stamp: lastOrder.time_stamp,
        };
        const line_items = lastOrder.line_items;
        const stripeUrl = await (0, stripe_1.checkout)(metadata, line_items, process.env.WEB_URL);
        if (!stripeUrl) {
            console.log('There was a problem issuing a stripe checkout link.');
            return;
        }
        sendNotification(account, 'purchase.offered', stripeUrl);
    });
}
//# sourceMappingURL=notification.js.map