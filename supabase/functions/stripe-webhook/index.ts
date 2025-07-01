// stripe-webhook/index.ts
// This Supabase Edge Function acts as a webhook endpoint for Stripe events.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.2.0?target=deno'; // Using a specific version for Deno compatibility

// Initialize Stripe with your secret key.
// It's crucial to use environment variables for sensitive information.
// In Supabase Edge Functions, you can set these in your project settings.
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16', // Use your desired Stripe API version
});

// Get the Stripe webhook secret from environment variables.
// This is used to verify the authenticity of incoming webhook events.
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string;

console.log('Stripe Webhook Edge Function Initialized');

serve(async (req) => {
  // Only allow POST requests for webhooks
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const rawBody = await req.text(); // Get the raw body for signature verification
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Stripe-Signature header missing.');
      return new Response('Stripe-Signature header missing', { status: 400 });
    }

    let event: Stripe.Event;

    try {
      // Verify the webhook signature to ensure the event is from Stripe
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeWebhookSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Log the event type for debugging purposes
    console.log(`Received Stripe event: ${event.type}`);

    // --- Handle different Stripe event types here ---
    // This is where you'd add your business logic based on the event.
    // For example, when a new account is created or updated:
    switch (event.type) {
      case 'account.updated':
        const account = event.data.object as Stripe.Account;
        console.log(`Account updated: ${account.id}`);
        // Example: Update your database with the account status or capabilities
        // await supabase.from('accounts').upsert({ id: account.id, status: account.charges_enabled, ... });
        break;
      case 'account.application.authorized':
        const applicationAuth = event.data.object as Stripe.Application;
        console.log(`Application authorized for account: ${applicationAuth.account}`);
        // Example: Record that an application has been authorized for a connected account
        break;
      case 'account.application.deauthorized':
        const applicationDeauth = event.data.object as Stripe.Application;
        console.log(`Application deauthorized for account: ${applicationDeauth.account}`);
        // Example: Handle the deauthorization, e.g., revoke access or update status
        break;
      case 'charge.succeeded':
        const charge = event.data.object as Stripe.Charge;
        console.log(`Charge succeeded for account: ${charge.transfer_data?.destination || 'N/A'}, amount: ${charge.amount}`);
        // Example: Process a successful charge, update order status, etc.
        break;
      // Add more cases for other events relevant to your Stripe Connect integration
      // e.g., 'payment_intent.succeeded', 'customer.created', 'payout.paid', etc.
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 OK response to Stripe to acknowledge receipt of the event
    return new Response('Webhook received', { status: 200 });

  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/stripe-webhook' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
