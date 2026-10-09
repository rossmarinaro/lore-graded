//import twilio from 'twilio';
import nodemailer from 'nodemailer';
import { EmailContextType, User } from './types';


//send confirmation email / SMS

export async function sendNotification(account: User, contextType: EmailContextType /* , data?: string */) 
{
    try {

        /********************* EMAIL */ 

        let subject, html;
        //const attachments = [];
    
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
            case 'submit':
    
                subject = 'Submission Complete';
                html = `<img src="${ process.env.LOGO_IMG }" alt="Company Logo" width="200" height="100">
                    <b><p>Thank you for your purchase. You will be added to the queue and notified if you've been selected.</p></b>`;
    
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

        // const SMS = await twilioClient.messages.create({
        //     body: messageBody,
        //     from: process.env.TWILIO_PHONE_NUMBER, 
        //     to: `+${ account.phone }`//'+1234567890' 
        // });
        
        // console.log('SMS sent:', SMS.sid);
    }

    catch(err) { 
        console.log('error automated email/sms: ', err); 
    }

}


