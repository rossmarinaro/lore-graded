import twilio from 'twilio';
import nodemailer from 'nodemailer';
import { User } from './types';


//send confirmation email / SMS

export async function sendNotification(account: User, contextType: string, data?: string) 
{
    try {

        const messageBody = `Thank you for your purchase. You will be added to the queue and notified if you've been selected.`;

        /********************* EMAIL */ 

        let subject, html;
        const attachments = [];
    
        const transporter = nodemailer.createTransport ({
            host: process.env.SMTP_HOST,
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER, // proxy email
                pass: process.env.SMTP_PASS, // smtp key
            },
            tls: { rejectUnauthorized: false } 
        }); 

        switch (contextType)
        {
            case 'purchase complete':
    
                subject = 'Purchase Complete';
                html = `<b><p>${ messageBody }</p></b>`;

                if (data?.length) 
                    attachments.push({ filename: 'log.txt', content: data });
    
            break;
            default: {
                console.log('cannot send email or SMS - contextType not defined.');
            } 
        }
    
        //send mail with defined transport object
    
        const email = {
            from: `"LOREGRADED" <${ process.env.SMTP_USER }>`, // sender address
            to: account.email, 
            subject, // Subject line
            html,  //html to be sent,
            attachments
        },
        
        info = await transporter.sendMail(email);
    
        console.log('email sent: ', info.messageId);

        /********************* SMS */ 

        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        const SMS = await twilioClient.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER, 
            to: `+${ account.phone }`//'+1234567890' 
        });
        
        console.log('SMS sent:', SMS.sid);
    }

    catch(err) { 
        console.log('error automated email/sms: ', err); 
    }

}


