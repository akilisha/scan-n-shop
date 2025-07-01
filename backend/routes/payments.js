const express = require("express");
const router = express.Router();
const {
  stripe,
  stripeConfig,
  calculateApplicationFee,
  createPaymentIntentOptions,
  createSetupIntentOptions,
  createConnectAccountOptions,
  createAccountLinkOptions,
  createSubscriptionOptions,
  generateReferralCode,
  validateReferralCode,
} = require("../client");

// =============================================================================
// PAYMENT INTENTS
// =============================================================================

// Create payment intent for one-time payments
router.post("/create-payment-intent", async (req, res) => {
  try {
    const {
      amount,
      currency = "usd",
      reference,
      connectedAccountId,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Invalid amount",
        message: "Amount must be greater than 0",
      });
    }

    const options = createPaymentIntentOptions(amount, currency);

    // Add metadata
    options.metadata = {
      reference: reference || `payment_${Date.now()}`,
      created_via: "kerbdrop_api",
    };

    let paymentIntent;

    if (connectedAccountId) {
      // Create payment intent for connected account
      const applicationFee = calculateApplicationFee(amount);
      options.application_fee_amount = applicationFee;
      options.transfer_data = {
        destination: connectedAccountId,
      };

      paymentIntent = await stripe.paymentIntents.create(options, {
        stripeAccount: connectedAccountId,
      });
    } else {
      // Create payment intent for platform
      paymentIntent = await stripe.paymentIntents.create(options);
    }

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    res.status(500).json({
      error: "Payment intent creation failed",
      message: error.message,
    });
  }
});

// Confirm payment intent
router.post("/confirm-payment", async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId, connectedAccountId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: "Missing payment intent ID",
      });
    }

    const confirmOptions = {};
    if (paymentMethodId) {
      confirmOptions.payment_method = paymentMethodId;
    }

    let paymentIntent;

    if (connectedAccountId) {
      paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        confirmOptions,
        {
          stripeAccount: connectedAccountId,
        },
      );
    } else {
      paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        confirmOptions,
      );
    }

    res.json({
      payment_intent: paymentIntent,
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    res.status(500).json({
      error: "Payment confirmation failed",
      message: error.message,
    });
  }
});

// =============================================================================
// SETUP INTENTS (for saving payment methods)
// =============================================================================

// Create setup intent for saving payment methods
router.post("/create-setup-intent", async (req, res) => {
  try {
    const { customerId, connectedAccountId } = req.body;

    const options = createSetupIntentOptions(customerId, connectedAccountId);

    let setupIntent;

    if (connectedAccountId) {
      setupIntent = await stripe.setupIntents.create(options, {
        stripeAccount: connectedAccountId,
      });
    } else {
      setupIntent = await stripe.setupIntents.create(options);
    }

    res.json({
      client_secret: setupIntent.client_secret,
      setup_intent_id: setupIntent.id,
    });
  } catch (error) {
    console.error("Setup intent creation error:", error);
    res.status(500).json({
      error: "Setup intent creation failed",
      message: error.message,
    });
  }
});

// =============================================================================
// STRIPE CONNECT ACCOUNT MANAGEMENT
// =============================================================================

// Create Connect account
router.post("/connect/create-account", async (req, res) => {
  try {
    const { type = "express", business_type = "individual" } = req.body;

    const options = createConnectAccountOptions(type, business_type);

    const account = await stripe.accounts.create(options);

    res.json({
      account_id: account.id,
      type: account.type,
      business_type: account.business_type,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      created: account.created,
    });
  } catch (error) {
    console.error("Connect account creation error:", error);
    res.status(500).json({
      error: "Account creation failed",
      message: error.message,
    });
  }
});

// Create account link for onboarding
router.post("/connect/create-account-link", async (req, res) => {
  try {
    const {
      account,
      refresh_url,
      return_url,
      type = "account_onboarding",
    } = req.body;

    if (!account || !refresh_url || !return_url) {
      return res.status(400).json({
        error: "Missing required parameters",
        message: "account, refresh_url, and return_url are required",
      });
    }

    const options = createAccountLinkOptions(account, refresh_url, return_url);
    options.type = type;

    const accountLink = await stripe.accountLinks.create(options);

    res.json({
      url: accountLink.url,
      expires_at: accountLink.expires_at,
    });
  } catch (error) {
    console.error("Account link creation error:", error);
    res.status(500).json({
      error: "Account link creation failed",
      message: error.message,
    });
  }
});

// Get Connect account details
router.get("/connect/account/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      id: account.id,
      type: account.type,
      business_type: account.business_type,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements,
      capabilities: account.capabilities,
      created: account.created,
    });
  } catch (error) {
    console.error("Account retrieval error:", error);
    res.status(500).json({
      error: "Account retrieval failed",
      message: error.message,
    });
  }
});

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

// Create subscription
router.post("/subscriptions/create", async (req, res) => {
  try {
    const { customerId, priceId, connectedAccountId } = req.body;

    if (!customerId || !priceId) {
      return res.status(400).json({
        error: "Missing required parameters",
        message: "customerId and priceId are required",
      });
    }

    const options = createSubscriptionOptions(
      customerId,
      priceId,
      connectedAccountId,
    );

    let subscription;

    if (connectedAccountId) {
      subscription = await stripe.subscriptions.create(options, {
        stripeAccount: connectedAccountId,
      });
    } else {
      subscription = await stripe.subscriptions.create(options);
    }

    res.json({
      subscription_id: subscription.id,
      client_secret: subscription.latest_invoice.payment_intent.client_secret,
      status: subscription.status,
    });
  } catch (error) {
    console.error("Subscription creation error:", error);
    res.status(500).json({
      error: "Subscription creation failed",
      message: error.message,
    });
  }
});

// Cancel subscription
router.post("/subscriptions/:subscriptionId/cancel", async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { connectedAccountId, cancelAtPeriodEnd = true } = req.body;

    const updateOptions = {
      cancel_at_period_end: cancelAtPeriodEnd,
    };

    let subscription;

    if (connectedAccountId) {
      subscription = await stripe.subscriptions.update(
        subscriptionId,
        updateOptions,
        {
          stripeAccount: connectedAccountId,
        },
      );
    } else {
      subscription = await stripe.subscriptions.update(
        subscriptionId,
        updateOptions,
      );
    }

    res.json({
      subscription_id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at,
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    res.status(500).json({
      error: "Subscription cancellation failed",
      message: error.message,
    });
  }
});

// =============================================================================
// REFERRAL SYSTEM
// =============================================================================

// Generate referral code
router.post("/referrals/generate-code", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "Missing user ID",
      });
    }

    const referralCode = generateReferralCode(userId);

    // In a real implementation, you would save this to your database
    // For now, we'll just return the generated code
    res.json({
      code: referralCode,
      userId: userId,
      created: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Referral code generation error:", error);
    res.status(500).json({
      error: "Referral code generation failed",
      message: error.message,
    });
  }
});

// Apply referral code
router.post("/referrals/apply-code", async (req, res) => {
  try {
    const { code, newUserId } = req.body;

    if (!code || !newUserId) {
      return res.status(400).json({
        error: "Missing required parameters",
        message: "code and newUserId are required",
      });
    }

    if (!validateReferralCode(code)) {
      return res.status(400).json({
        error: "Invalid referral code format",
      });
    }

    // In a real implementation, you would:
    // 1. Validate the referral code exists in the database
    // 2. Check if it's still valid (not expired, not already used by this user)
    // 3. Create a referral record
    // 4. Award credits to the referrer

    res.json({
      success: true,
      code: code,
      newUserId: newUserId,
      creditAwarded: 1, // 1 month free
      message: "Referral code applied successfully",
    });
  } catch (error) {
    console.error("Referral code application error:", error);
    res.status(500).json({
      error: "Referral code application failed",
      message: error.message,
    });
  }
});

// Get referral stats
router.get("/referrals/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // In a real implementation, you would query your database for actual stats
    // For now, we'll return mock data
    const mockStats = {
      totalReferrals: 5,
      successfulReferrals: 3,
      pendingReferrals: 2,
      totalCredits: 3,
      availableCredits: 2,
      usedCredits: 1,
      referralCode: generateReferralCode(userId),
      recentReferrals: [
        {
          id: "ref_1",
          referredEmail: "john@example.com",
          status: "completed",
          creditAwarded: 1,
          createdAt: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          completedAt: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          id: "ref_2",
          referredEmail: "jane@example.com",
          status: "pending",
          creditAwarded: 0,
          createdAt: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          id: "ref_3",
          referredEmail: "bob@example.com",
          status: "completed",
          creditAwarded: 1,
          createdAt: new Date(
            Date.now() - 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          completedAt: new Date(
            Date.now() - 10 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ],
    };

    res.json(mockStats);
  } catch (error) {
    console.error("Referral stats retrieval error:", error);
    res.status(500).json({
      error: "Referral stats retrieval failed",
      message: error.message,
    });
  }
});

// =============================================================================
// WEBHOOKS
// =============================================================================

// Stripe webhooks handler
router.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        stripeConfig.webhookSecret,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    console.log(`Received webhook: ${event.type}`);

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log("Payment succeeded:", paymentIntent.id);
        // Handle successful payment
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        console.log("Payment failed:", failedPayment.id);
        // Handle failed payment
        break;

      case "account.updated":
        const account = event.data.object;
        console.log("Account updated:", account.id);
        // Handle account updates (e.g., verification status changes)
        break;

      case "account.application.deauthorized":
        const deauthorizedAccount = event.data.object;
        console.log("Account deauthorized:", deauthorizedAccount.id);
        // Handle account deauthorization
        break;

      case "invoice.payment_succeeded":
        const invoice = event.data.object;
        console.log("Invoice payment succeeded:", invoice.id);
        // Handle successful subscription payment
        break;

      case "invoice.payment_failed":
        const failedInvoice = event.data.object;
        console.log("Invoice payment failed:", failedInvoice.id);
        // Handle failed subscription payment
        break;

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object;
        console.log("Subscription deleted:", deletedSubscription.id);
        // Handle subscription cancellation
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  },
);

module.exports = router;
