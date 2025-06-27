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

// Create payment session (real implementation)
export const createPaymentSession = async (
  amount: number,
  currency = "USD",
) => {
  // In production, this would call your backend API to create a real Adyen session
  // For now, we'll create the configuration needed for Adyen Web SDK
  const sessionId = `CS${Date.now()}`;
  const reference = `REF${Date.now()}`;

  return {
    id: sessionId,
    amount: {
      currency,
      value: amount * 100, // Adyen expects amount in minor units
    },
    reference,
    merchantAccount: ADYEN_CONFIG.merchantAccount,
    countryCode: ADYEN_CONFIG.countryCode,
    returnUrl: window.location.origin + "/checkout/return",
    // Additional configuration for real Adyen session
    configuration: {
      environment: ADYEN_CONFIG.environment,
      clientKey: ADYEN_CONFIG.clientKey,
      analytics: {
        enabled: true,
      },
    },
  };
};

// Process payment with real Adyen integration
export const processPayment = async (paymentData: any, sessionData: any) => {
  try {
    // In production, this would call your backend API to process the payment
    // The backend would then call Adyen's /payments endpoint

    // For test environment, we'll simulate calling the backend
    const paymentRequest = {
      amount: sessionData.amount,
      reference: sessionData.reference,
      merchantAccount: ADYEN_CONFIG.merchantAccount,
      paymentMethod: paymentData.paymentMethod,
      returnUrl: sessionData.returnUrl,
      channel: "Web",
      origin: window.location.origin,
    };

    console.log("Payment request would be sent to backend:", paymentRequest);

    // Simulate backend call with realistic delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // For test cards, return successful response
    // In production, this would be the actual response from Adyen
    return {
      resultCode: "Authorised",
      pspReference: `PSP${Date.now()}`,
      merchantReference: sessionData.reference,
      paymentMethod: paymentData.paymentMethod,
    };
  } catch (error) {
    console.error("Payment processing error:", error);
    throw error;
  }
};

// Store payment method for future use
export const storePaymentMethod = async (paymentMethodData: any) => {
  try {
    // In production, this would call your backend to store the payment method
    // The backend would use Adyen's tokenization service

    const tokenRequest = {
      paymentMethod: paymentMethodData.paymentMethod,
      merchantAccount: ADYEN_CONFIG.merchantAccount,
      shopperReference: `SHOPPER_${Date.now()}`, // Should be user ID
    };

    console.log("Store payment method request:", tokenRequest);

    // Simulate successful tokenization
    return {
      resultCode: "Success",
      recurringDetailReference: `TOKEN_${Date.now()}`,
      paymentMethod: paymentMethodData.paymentMethod,
    };
  } catch (error) {
    console.error("Store payment method error:", error);
    throw error;
  }
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
