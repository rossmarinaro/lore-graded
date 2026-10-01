
import nodemailer from 'nodemailer';
import { CheckoutMetadata } from './types';


//send confirmation email / SMS

export async function sendEmailSMS(account: CheckoutMetadata, type: string, data?: string) 
{
    try {

        let subject, html;
        const attachments = [];
    
        const transporter = nodemailer.createTransport ({
            host: process.env.SMTP_HOST,
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_EMAIL, // proxy email
                pass: process.env.NODE_MAILER, // smtp key
            },
            tls: { rejectUnauthorized: false } 
        }); 

        switch (type)
        {
            case 'purchase complete':
    
                subject = "Purchase Complete";
        
                html = `
                    <b><p>Thank you for your purchase. You will be added to the queue and notified if you've been selected.</p></b>
                `;

                if (data?.length) 
                    attachments.push({ filename: 'log.txt', content: data });
    
            break;
        }
    
        //send mail with defined transport object
    
        const email = {
            from: `"LOREGRADED" <${process.env.SMTP_EMAIL}>`, // sender address
            to: account.email, 
            subject, // Subject line
            html,  //html to be sent,
            //attachments
        },
        
        info = await transporter.sendMail(email);
    
        console.log('Message sent: ', info.messageId);
    }

    catch(err){ 
        console.log('error automated email/sms: ', err); 
    }

}


