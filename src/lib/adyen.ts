import { AdyenCheckout } from "@adyen/adyen-web";

// Adyen configuration
export const ADYEN_CONFIG = {
  environment: import.meta.env.VITE_ADYEN_ENVIRONMENT || "test",
  clientKey:
    import.meta.env.VITE_ADYEN_CLIENT_KEY ||
    "test_JQROZLAUB5F5HBNPELQMZYYSRIA4S64Q",
  merchantAccount:
    import.meta.env.VITE_ADYEN_MERCHANT_ACCOUNT || "CraftedOnECOM",
  countryCode: "US",
  amount: {
    currency: "USD",
    value: 0, // Will be set dynamically
  },
  locale: "en-US",
};

// Payment methods configuration
export const PAYMENT_METHODS_CONFIG = {
  paymentMethods: {
    card: {
      hasHolderName: true,
      holderNameRequired: true,
      enableStoreDetails: true,
      hideCvcStoredCard: false,
      hideCvc: false,
      name: "Credit or debit card",
    },
  },
  // Digital Wallets
  applepay: {
    amount: ADYEN_CONFIG.amount,
    countryCode: ADYEN_CONFIG.countryCode,
  },
  googlepay: {
    amount: ADYEN_CONFIG.amount,
    countryCode: ADYEN_CONFIG.countryCode,
    environment: ADYEN_CONFIG.environment === "live" ? "PRODUCTION" : "TEST",
  },
};

// Adyen styling to match our app theme
export const ADYEN_STYLING = {
  base: {
    color: "hsl(20, 14.3%, 4.1%)",
    fontSize: "16px",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    fontWeight: "400",
    lineHeight: "1.5",
  },
  error: {
    color: "hsl(0, 84.2%, 60.2%)",
  },
  focus: {
    color: "hsl(15, 84%, 58%)",
  },
  placeholder: {
    color: "hsl(25, 5.3%, 44.7%)",
  },
};

// Create payment session (simulated for demo)
export const createPaymentSession = async (
  amount: number,
  currency = "USD",
) => {
  // In a real app, this would call your backend API to create a payment session
  // For demo purposes, we'll simulate this
  return {
    id: `CS${Date.now()}`,
    sessionData: btoa(
      JSON.stringify({
        id: `CS${Date.now()}`,
        amount: {
          currency,
          value: amount * 100, // Adyen expects amount in minor units
        },
        merchantAccount: ADYEN_CONFIG.merchantAccount,
        reference: `REF${Date.now()}`,
        countryCode: ADYEN_CONFIG.countryCode,
        returnUrl: window.location.origin + "/checkout/return",
      }),
    ),
    amount: {
      currency,
      value: amount * 100,
    },
  };
};

// Process payment (simulated for demo)
export const processPayment = async (paymentData: any) => {
  // In a real app, this would call your backend API
  // For demo purposes, we'll simulate success
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        resultCode: "Authorised",
        pspReference: `PSP${Date.now()}`,
        merchantReference: `REF${Date.now()}`,
      });
    }, 2000);
  });
};

// Initialize Adyen Checkout
export const initializeAdyenCheckout = (configuration: any) => {
  return AdyenCheckout({
    ...ADYEN_CONFIG,
    ...configuration,
    analytics: {
      enabled: false, // Disable for demo
    },
    risk: {
      enabled: false, // Disable for demo
    },
  });
};
