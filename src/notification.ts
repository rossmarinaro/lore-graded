//import twilio from 'twilio';
import nodemailer from 'nodemailer';
import { EmailContextType, Account } from './types/types';
import { Database } from './database';
import { checkout } from './stripe';


export async function sendNotification(account: Account, contextType: EmailContextType, stripeUrl = '') 
{
    const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

    try {

        /********************* EMAIL */ 

        let subject, html;
        //const attachments = [];
    
        const transporter = nodemailer.createTransport ({
            host: process.env.SMTP_HOST,
            port: isProd ? 465 : 587,
            secure: isProd, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER, // proxy email
                pass: process.env.SMTP_PASS, // smtp key
            },
            tls: { rejectUnauthorized: false } 
        }); 

        switch (contextType)
        { 
            case 'submit':
    
                subject = 'Submission Complete';
                html = `<img src="${ process.env.LOGO_IMG }" alt="Company Logo" width="200" height="100">
                    <b><p>Thank you for your purchase. You will be added to the queue and notified if you've been selected.</p></b>`;
    
            break;
            case 'purchase.offered':
            { 
                subject = 'You Have Been Selected!';
                html = `<img src="${ process.env.LOGO_IMG }" alt="Company Logo" width="200" height="100">
                    <b>
                        <p>Congratulations, you have been selected for the Sunday card grading drop. Please click the button below to complete your checkout:</p>
                        <a href="${ stripeUrl }" style="background-color: #635bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Pay Now</a>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p><a href="${ stripeUrl }">${ stripeUrl }</a></p>
                    </b>`;
            }
            break;
            case 'purchase.complete':
    
                subject = 'Purchase Complete';
                html = `<img src="${ process.env.LOGO_IMG }" alt="Company Logo" width="200" height="100">
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
    
        //send mail with defined transport object
    
        const email = {
            from: `"LOREGRADED" <${ process.env.SMTP_USER }>`, // sender address
            to: account.email, 
            subject, 
            html,  
            //attachments
        },
        
        info = await transporter.sendMail(email);
    
        console.log('email sent to: ', info.envelope.to);

        /********************* SMS */ 

        // const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const SMS = '';
        // const SMS = await twilioClient.messages.create({
        //     body: messageBody,
        //     from: process.env.TWILIO_PHONE_NUMBER, 
        //     to: `+${ account.phone }`//'+1234567890' 
        // });
        
        // console.log('SMS sent:', SMS.sid);

        return { email: email.to, phone: SMS };
    }

    catch(err) { 
        console.log('error automated email/sms: ', err); 
    }

}


//---------------------------------------------


export async function sendTargetedNotifications() 
{
    const accounts = await Database.findAll(process.env.MONGODB_COLLECTION as string, -1);
    console.log(accounts);

    let totalOrders = 0;
    const totalAllowedOrders = 50;
    const selectedAccounts: Account[] = [];

    accounts.forEach(i => {
        if ((i.orders && i.orders.length) && totalOrders + i.orders.length < totalAllowedOrders) {
            selectedAccounts.push(i); 
            totalOrders += i.orders.length;
        }
    });
    
    //notify selected accounts to pay

    selectedAccounts.forEach(async account => {

        //todo: loop over other orders
        //const orders = account.orders?.map(order => );   

        if (!account.orders || !account.orders[0])
            return;

        const metadata = { 
            user_id: account.orders[0].user_id,
            order_id: account.orders[0].order_id,
            time_stamp: account.orders[0].time_stamp,
        };

        const line_items = account.orders[0].line_items;

        const stripeUrl = await checkout(metadata, line_items, process.env.WEB_URL as string);

        if (!stripeUrl) {
            console.log('There was a problem issuing a stripe checkout link.');
            return;
        }

        sendNotification(account, 'purchase.offered', stripeUrl);
    });
}