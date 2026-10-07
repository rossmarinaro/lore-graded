import Stripe from 'stripe';

import { Database } from './database'
import { Request, Response } from 'express'
import { AuthenticatedRequest, Order, User} from './types'
import { sendNotification } from './notification'
import { getUserID } from './utils';

require('dotenv').config();

//----------------------------------

// export async function login (req: Request<Record<string, never>, unknown, UnAuthenticatedRequest>, res: Response) 
// {
//   try {

//     const account = await Database.findOne({ email: req.body.email }, 1);

//     if (account) 
//     {
//       const passwordIsValid = await argon2.verify(account.password, req.body.password);
      
//       if (!passwordIsValid) 
//         return res.status(401).json({ error: 'Invalid email or password.' });

//       jwt.sign({ _id: account._id }, process.env.JWT_SECRET as string, (err: Error | null, webtoken: string | undefined) => {

//         if (err)
//           res.status(500).json({ message: err });

//         else {
//             res.json({ webtoken });
//             console.log('Account', account.username, account._id, 'logged in.');
//         }
//         res.status(200).json({ success: true });
//       });
//     }
//     else
//       res.status(401).json({ success: false });
//   }
//   catch (error) {
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// }


//----------------------------------------------------


export async function logout (_req: Request, res: Response) 
{
  try {
    res.clearCookie('session_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    res.redirect(302, process.env.WEB_URL as string);
  }
  catch (error) {
    console.error('logout::Error: ', error);
    res.status(500).send('Internal Server Error');
  }
}

//----------------------------------------------------


export async function submitOrder (req: AuthenticatedRequest, res: Response)  
{
  const order = req.body.order as Order;

  console.log('Incoming order: ', order);

  try 
  {                  
   // if (!order.cards.length)
   //   res.status(400).send('No cards in order.');
  //  else 
    {
      const projection = { email: 1, phone: 1 };
      const account = await Database.findOneAndUpdate({ _id: getUserID(req._id as string) }, { order }, projection);

      if (account)
      {
        //todo: handle submitting order

        sendNotification(account, 'submit');

        res.redirect(302, `${ process.env.WEB_URL as string }/purchase-submitted`);
      }
    }
  }
  catch (error) {
    console.error('submitOrder::Error: ', error);
    res.status(500).send('Internal Server Error');
  }
}


//-----------------------------------------------



export async function checkout (req: AuthenticatedRequest, res: Response) 
{ 
  try { 
    
    const projection = { email: 1, phone: 1 };
    const account = await Database.findOne({ _id: getUserID(req._id as string) }, projection);

    if (account)
    {
      const metadata = {
        recipient: req.body.recipient ?? null,
        email: account.email ?? null,
        phone: account.phone ?? null,
        paid: String(account.paid)
      }

      const price = 100; //one dollar placeholder

      const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY as string, { apiVersion: '2026-08-26.dahlia' });

      const stripeSession = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          success_url: `${ process.env.WEB_URL }/checkout-success`, 
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

      console.log( 
        'Checkout Success Link Generated: ', stripeSession.url, 
        '\nTotal: ', price, 
        '\nMetadata: ', JSON.stringify(account)
      );
        
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


//----------------------------------


export async function webhook (req: Request, res: Response) 
{ 
  try {

    const event = req.body, 
          webhookSession: User = JSON.parse(event.data.object.metadata[0]); 

    switch (event.type) 
    {
      case 'checkout.session.completed':

        const _id = webhookSession._id;
        const projection = { email: 1 };
        const account = await Database.findOneAndUpdate({ _id }, projection, { paid: true });

        if (account)
        {
          console.log(`user: ${ account.email } paid. Sending notification.`);
            
          //send confirmation email / SMS

          sendNotification(webhookSession, 'purchase.complete');
        }

      break;

      default: console.log(`Unhandled event type: ${ event.type }`); 
      break;
    }
  }

  catch(error) {
    console.error('webhook::Error: ', error);
  }

  res.json({ received: true });
}


