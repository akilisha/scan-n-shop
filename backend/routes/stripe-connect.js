const express = require("express");
const router = express.Router();
const {
  stripe,
  stripeConfig,
  calculateApplicationFee,
  createPaymentIntentOptions,
  createConnectAccountOptions,
  createAccountLinkOptions,
} = require("../client");

// =============================================================================
// STRIPE CONNECT MARKETPLACE ENDPOINTS
// =============================================================================

// Create marketplace payment intent with application fees
router.post("/marketplace/create-payment-intent", async (req, res) => {
  try {
    const {
      amount,
      currency = "usd",
      reference,
      connectedAccountId,
      applicationFeeAmount,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Invalid amount",
        message: "Amount must be greater than 0",
      });
    }

    if (!connectedAccountId) {
      return res.status(400).json({
        error: "Missing connected account",
        message: "connectedAccountId is required for marketplace payments",
      });
    }

    // Calculate application fee if not provided
    const applicationFee =
      applicationFeeAmount || calculateApplicationFee(amount);

    const options = {
      amount,
      currency,
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: connectedAccountId,
      },
      on_behalf_of: connectedAccountId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        reference: reference || `marketplace_payment_${Date.now()}`,
        created_via: "kerbdrop_marketplace",
        seller_account: connectedAccountId,
      },
    };

    const paymentIntent = await stripe.paymentIntents.create(options);

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      application_fee_amount: applicationFee,
      seller_receives: amount - applicationFee,
    });
  } catch (error) {
    console.error("Marketplace payment intent creation error:", error);
    res.status(500).json({
      error: "Marketplace payment intent creation failed",
      message: error.message,
    });
  }
});

// Create Express Connect account for sellers
router.post("/connect/create-express-account", async (req, res) => {
  try {
    const {
      email,
      business_type = "individual",
      country = "US",
      refresh_url,
      return_url,
    } = req.body;

    if (!email || !refresh_url || !return_url) {
      return res.status(400).json({
        error: "Missing required parameters",
        message: "email, refresh_url, and return_url are required",
      });
    }

    // Create Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: country,
      email: email,
      business_type: business_type,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: "daily",
          },
        },
        payments: {
          statement_descriptor: "KERBDROP",
        },
      },
      metadata: {
        platform: "kerbdrop",
        created_via: "seller_onboarding",
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refresh_url,
      return_url: return_url,
      type: "account_onboarding",
      collect: "eventually_due",
    });

    res.json({
      account_id: account.id,
      onboarding_url: accountLink.url,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      created: account.created,
    });
  } catch (error) {
    console.error("Express account creation error:", error);
    res.status(500).json({
      error: "Express account creation failed",
      message: error.message,
    });
  }
});

// Create account link for re-onboarding
router.post("/connect/create-account-link", async (req, res) => {
  try {
    const {
      account_id,
      refresh_url,
      return_url,
      type = "account_onboarding",
    } = req.body;

    if (!account_id || !refresh_url || !return_url) {
      return res.status(400).json({
        error: "Missing required parameters",
        message: "account_id, refresh_url, and return_url are required",
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: account_id,
      refresh_url: refresh_url,
      return_url: return_url,
      type: type,
      collect: "eventually_due",
    });

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

// Get Connect account status
router.get("/connect/account/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      id: account.id,
      type: account.type,
      business_type: account.business_type,
      country: account.country,
      email: account.email,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        past_due: account.requirements?.past_due || [],
        pending_verification: account.requirements?.pending_verification || [],
        disabled_reason: account.requirements?.disabled_reason,
      },
      capabilities: account.capabilities,
      business_profile: {
        name: account.business_profile?.name,
        product_description: account.business_profile?.product_description,
        support_email: account.business_profile?.support_email,
        support_phone: account.business_profile?.support_phone,
        support_url: account.business_profile?.support_url,
        url: account.business_profile?.url,
      },
      settings: {
        payouts: account.settings?.payouts,
        payments: account.settings?.payments,
      },
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

// Get account dashboard link
router.post("/connect/dashboard-link", async (req, res) => {
  try {
    const { account_id } = req.body;

    if (!account_id) {
      return res.status(400).json({
        error: "Missing account ID",
      });
    }

    const loginLink = await stripe.accounts.createLoginLink(account_id);

    res.json({
      url: loginLink.url,
    });
  } catch (error) {
    console.error("Dashboard link creation error:", error);
    res.status(500).json({
      error: "Dashboard link creation failed",
      message: error.message,
    });
  }
});

// Calculate marketplace fees
router.post("/marketplace/calculate-fees", async (req, res) => {
  try {
    const { amount, currency = "usd" } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Invalid amount",
        message: "Amount must be greater than 0",
      });
    }

    const applicationFee = calculateApplicationFee(amount);
    const sellerReceives = amount - applicationFee;

    // Calculate fee breakdown
    const percentageFee = Math.round(
      amount * stripeConfig.applicationFeePercent,
    );
    const fixedFee = stripeConfig.applicationFeeFixed;

    res.json({
      original_amount: amount,
      currency: currency,
      application_fee: applicationFee,
      seller_receives: sellerReceives,
      fee_breakdown: {
        percentage_fee: percentageFee,
        fixed_fee: fixedFee,
        total_fee: applicationFee,
        fee_percentage: stripeConfig.applicationFeePercent * 100,
      },
    });
  } catch (error) {
    console.error("Fee calculation error:", error);
    res.status(500).json({
      error: "Fee calculation failed",
      message: error.message,
    });
  }
});

// Transfer funds to connected account
router.post("/connect/transfer", async (req, res) => {
  try {
    const { amount, currency = "usd", destination, transfer_group } = req.body;

    if (!amount || !destination) {
      return res.status(400).json({
        error: "Missing required parameters",
        message: "amount and destination are required",
      });
    }

    const transfer = await stripe.transfers.create({
      amount: amount,
      currency: currency,
      destination: destination,
      transfer_group: transfer_group,
      metadata: {
        created_via: "kerbdrop_api",
      },
    });

    res.json({
      transfer_id: transfer.id,
      amount: transfer.amount,
      currency: transfer.currency,
      destination: transfer.destination,
      created: transfer.created,
    });
  } catch (error) {
    console.error("Transfer creation error:", error);
    res.status(500).json({
      error: "Transfer creation failed",
      message: error.message,
    });
  }
});

// List transfers for an account
router.get("/connect/transfers/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;
    const { limit = 10 } = req.query;

    const transfers = await stripe.transfers.list({
      destination: accountId,
      limit: parseInt(limit),
    });

    res.json({
      transfers: transfers.data.map((transfer) => ({
        id: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency,
        created: transfer.created,
        description: transfer.description,
        transfer_group: transfer.transfer_group,
        metadata: transfer.metadata,
      })),
      has_more: transfers.has_more,
    });
  } catch (error) {
    console.error("Transfer listing error:", error);
    res.status(500).json({
      error: "Transfer listing failed",
      message: error.message,
    });
  }
});

// Refund marketplace payment
router.post("/marketplace/refund", async (req, res) => {
  try {
    const {
      payment_intent_id,
      amount,
      reason = "requested_by_customer",
      refund_application_fee = true,
      reverse_transfer = true,
    } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({
        error: "Missing payment intent ID",
      });
    }

    const refundOptions = {
      payment_intent: payment_intent_id,
      reason: reason,
      refund_application_fee: refund_application_fee,
      reverse_transfer: reverse_transfer,
      metadata: {
        refunded_via: "kerbdrop_api",
      },
    };

    if (amount) {
      refundOptions.amount = amount;
    }

    const refund = await stripe.refunds.create(refundOptions);

    res.json({
      refund_id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      payment_intent: refund.payment_intent,
      created: refund.created,
    });
  } catch (error) {
    console.error("Refund creation error:", error);
    res.status(500).json({
      error: "Refund creation failed",
      message: error.message,
    });
  }
});

module.exports = router;
