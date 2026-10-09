"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendNotification(account, contextType) {
    try {
        let subject, html;
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: 587,
            secure: false,
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
    }
    catch (err) {
        console.log('error automated email/sms: ', err);
    }
}
//# sourceMappingURL=notification.js.map