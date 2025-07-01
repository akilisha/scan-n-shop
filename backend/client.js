// Load environment variables
require("dotenv").config();

// Require the Stripe SDK
const Stripe = require("stripe");

// Set up the Stripe client with Connect capabilities
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia", // Use the latest API version
});

// Stripe Connect configuration
const stripeConfig = {
  // Environment settings
  environment: process.env.STRIPE_ENVIRONMENT || "test",

  // Application fee percentage for marketplace (e.g., 2.9% + 30¢)
  applicationFeePercent: process.env.STRIPE_APPLICATION_FEE_PERCENT || 0.029,
  applicationFeeFixed: process.env.STRIPE_APPLICATION_FEE_FIXED || 30, // cents

  // Webhook settings
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  // Connect settings
  connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID,

  // Default currency
  currency: "usd",

  // Supported payment methods
  paymentMethods: [
    "card",
    "us_bank_account",
    "link",
    "cashapp",
    "affirm",
    "klarna",
  ],
};

// Helper function to calculate application fees
const calculateApplicationFee = (amount) => {
  const percentageFee = Math.round(amount * stripeConfig.applicationFeePercent);
  const totalFee = percentageFee + stripeConfig.applicationFeeFixed;
  return Math.min(totalFee, amount); // Fee cannot exceed the payment amount
};

// Helper function to create payment intent options
const createPaymentIntentOptions = (
  amount,
  currency = "usd",
  connectedAccountId = null,
) => {
  const options = {
    amount,
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
    capture_method: "automatic",
  };

  // Add Connect-specific options if connected account is provided
  if (connectedAccountId) {
    const applicationFee = calculateApplicationFee(amount);
    options.application_fee_amount = applicationFee;
    options.transfer_data = {
      destination: connectedAccountId,
    };
    options.on_behalf_of = connectedAccountId;
  }

  return options;
};

// Helper function to create setup intent options
const createSetupIntentOptions = (
  customerId = null,
  connectedAccountId = null,
) => {
  const options = {
    payment_method_types: ["card"],
    usage: "off_session",
  };

  if (customerId) {
    options.customer = customerId;
  }

  // For Connect accounts, setup intents are created on behalf of the connected account
  if (connectedAccountId) {
    options.on_behalf_of = connectedAccountId;
  }

  return options;
};

// Helper function to create Connect account options
const createConnectAccountOptions = (
  type = "express",
  businessType = "individual",
) => {
  const options = {
    type,
    business_type: businessType,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    settings: {
      payouts: {
        schedule: {
          interval: "daily", // Can be 'daily', 'weekly', or 'monthly'
        },
      },
    },
  };

  // Add specific settings based on account type
  if (type === "express") {
    options.settings.payments = {
      statement_descriptor: "KERBDROP",
    };
  }

  return options;
};

// Helper function to create account link options
const createAccountLinkOptions = (accountId, refreshUrl, returnUrl) => {
  return {
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
    collect: "eventually_due", // Collect all eventually due requirements
  };
};

// Helper function to create subscription options for Connect
const createSubscriptionOptions = (
  customerId,
  priceId,
  connectedAccountId = null,
) => {
  const options = {
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
  };

  // Add Connect-specific options
  if (connectedAccountId) {
    options.application_fee_percent = stripeConfig.applicationFeePercent * 100; // Stripe expects percentage
    options.transfer_data = {
      destination: connectedAccountId,
    };
    options.on_behalf_of = connectedAccountId;
  }

  return options;
};

// Referral system helpers
const generateReferralCode = (userId) => {
  // Generate a unique referral code based on user ID and timestamp
  const timestamp = Date.now().toString(36);
  const userPart = userId.slice(-8);
  return `KERB${userPart.toUpperCase()}${timestamp.toUpperCase()}`.slice(0, 12);
};

const validateReferralCode = (code) => {
  // Basic validation for referral code format
  return /^KERB[A-Z0-9]{8}$/.test(code);
};

module.exports = {
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
};
