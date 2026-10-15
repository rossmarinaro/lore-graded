import Stripe, { MetadataParam } from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY as string, { apiVersion: '2026-08-26.dahlia' });


export async function checkout (
  metadata: MetadataParam, 
  line_items: Stripe.Checkout.SessionCreateParams.LineItem[], 
  success_url: string, 
  cancel_url: string = success_url
)
{ 
  try { 
    
    const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url, 
        cancel_url,
        metadata,
        line_items
    });

    console.log('Checkout Success Link Generated: ', stripeSession.url, '\nMetadata: ', JSON.stringify(metadata));
      
    return stripeSession.url;
  } 
  catch (error) {
    console.error('checkout::Error: ', error);
  }
}
