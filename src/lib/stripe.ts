import { loadStripe, Stripe } from "@stripe/stripe-js";

// Stripe Connect configuration
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
  environment: import.meta.env.VITE_STRIPE_ENVIRONMENT || "test",
  currency: "USD",
  countryCode: "US",
};

// Stripe Connect payment method types
export type StripePaymentMethodType =
  | "card"
  | "us_bank_account"
  | "link"
  | "cashapp"
  | "affirm"
  | "klarna";

// Payment component configuration for Stripe
export const STRIPE_PAYMENT_METHODS = [
  {
    type: "card",
    name: "Credit or Debit Card",
    icon: "credit-card",
  },
  {
    type: "us_bank_account",
    name: "Bank Account",
    icon: "bank",
  },
  {
    type: "link",
    name: "Link",
    icon: "link",
  },
  {
    type: "cashapp",
    name: "Cash App Pay",
    icon: "wallet",
  },
];

// Stripe Elements styling to match our app theme
export const STRIPE_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "hsl(20, 14.3%, 4.1%)",
      fontFamily: "Inter, sans-serif",
      fontSize: "16px",
      fontWeight: "400",
      lineHeight: "1.5",
      "::placeholder": {
        color: "hsl(25, 5.3%, 44.7%)",
      },
    },
    invalid: {
      color: "hsl(0, 84.2%, 60.2%)",
      iconColor: "hsl(0, 84.2%, 60.2%)",
    },
  },
};

// Initialize Stripe instance
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);
  }
  return stripePromise;
};

// Create payment intent for one-time payments
export const createPaymentIntent = async (
  amount: number,
  currency: string = "usd",
  reference: string,
  connectedAccountId?: string,
) => {
  try {
    // Use the backend server running on port 8000
    const response = await fetch(
      "http://localhost:8000/api/create-payment-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount * 100, // Stripe expects amount in cents
          currency,
          reference,
          connectedAccountId,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to create payment intent");
    }

    return await response.json();
  } catch (error) {
    console.error("Payment intent creation error:", error);
    throw error;
  }
};

// Create setup intent for saving payment methods
export const createSetupIntent = async (
  customerId?: string,
  connectedAccountId?: string,
) => {
  try {
    const response = await fetch("/api/payments/create-setup-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId,
        connectedAccountId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create setup intent");
    }

    return await response.json();
  } catch (error) {
    console.error("Setup intent creation error:", error);
    throw error;
  }
};

// Process payment with Stripe
export const confirmPayment = async (
  stripe: Stripe,
  elements: any,
  clientSecret: string,
  returnUrl: string,
) => {
  try {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: "if_required",
    });

    if (error) {
      console.error("Payment confirmation error:", error);
      return { error };
    }

    return { paymentIntent };
  } catch (error) {
    console.error("Payment processing error:", error);
    throw error;
  }
};

// Save payment method for future use
export const savePaymentMethod = async (
  stripe: Stripe,
  elements: any,
  clientSecret: string,
) => {
  try {
    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (error) {
      console.error("Payment method save error:", error);
      return { error };
    }

    return { setupIntent };
  } catch (error) {
    console.error("Payment method storage error:", error);
    throw error;
  }
};

// Stripe Connect onboarding functions
export const createConnectAccount = async (
  accountType: "express" | "standard" = "express",
  businessType: "individual" | "company" = "individual",
) => {
  try {
    const response = await fetch("/api/connect/create-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: accountType,
        business_type: businessType,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create Connect account");
    }

    return await response.json();
  } catch (error) {
    console.error("Connect account creation error:", error);
    throw error;
  }
};

export const createAccountLink = async (
  accountId: string,
  refreshUrl: string,
  returnUrl: string,
) => {
  try {
    const response = await fetch("/api/connect/create-account-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create account link");
    }

    return await response.json();
  } catch (error) {
    console.error("Account link creation error:", error);
    throw error;
  }
};

export const getConnectAccount = async (accountId: string) => {
  try {
    const response = await fetch(`/api/connect/account/${accountId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to retrieve Connect account");
    }

    return await response.json();
  } catch (error) {
    console.error("Connect account retrieval error:", error);
    throw error;
  }
};

// Create subscription for recurring payments
export const createSubscription = async (
  customerId: string,
  priceId: string,
  connectedAccountId?: string,
) => {
  try {
    const response = await fetch("/api/subscriptions/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId,
        priceId,
        connectedAccountId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create subscription");
    }

    return await response.json();
  } catch (error) {
    console.error("Subscription creation error:", error);
    throw error;
  }
};

// Referral system functions
export const generateReferralCode = async (userId: string) => {
  try {
    const response = await fetch("/api/referrals/generate-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate referral code");
    }

    return await response.json();
  } catch (error) {
    console.error("Referral code generation error:", error);
    throw error;
  }
};

export const applyReferralCode = async (code: string, newUserId: string) => {
  try {
    const response = await fetch("/api/referrals/apply-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, newUserId }),
    });

    if (!response.ok) {
      throw new Error("Failed to apply referral code");
    }

    return await response.json();
  } catch (error) {
    console.error("Referral code application error:", error);
    throw error;
  }
};

export const getReferralStats = async (userId: string) => {
  try {
    const response = await fetch(`/api/referrals/stats/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get referral stats");
    }

    return await response.json();
  } catch (error) {
    console.error("Referral stats retrieval error:", error);
    throw error;
  }
};

export default {
  STRIPE_CONFIG,
  STRIPE_PAYMENT_METHODS,
  STRIPE_ELEMENT_OPTIONS,
  getStripe,
  createPaymentIntent,
  createSetupIntent,
  confirmPayment,
  savePaymentMethod,
  createConnectAccount,
  createAccountLink,
  getConnectAccount,
  createSubscription,
  generateReferralCode,
  applyReferralCode,
  getReferralStats,
};
