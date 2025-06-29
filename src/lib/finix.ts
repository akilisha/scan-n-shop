// Finix configuration
export const FINIX_CONFIG = {
  environment: import.meta.env.VITE_FINIX_ENVIRONMENT || "sandbox",
  applicationId: import.meta.env.VITE_FINIX_APPLICATION_ID || "",
  username: import.meta.env.VITE_FINIX_USERNAME || "",
  password: import.meta.env.VITE_FINIX_PASSWORD || "",
  countryCode: "US",
  currency: "USD",
  amount: {
    value: 0,
    currency: "USD",
  },
};

// Finix payment method types
export type PaymentMethodType =
  | "PAYMENT_CARD"
  | "BANK_ACCOUNT"
  | "DIGITAL_WALLET";

// Payment component configuration for Finix
export const FINIX_PAYMENT_METHODS = [
  {
    type: "card",
    name: "Credit or Debit Card",
    icon: "credit-card",
  },
  {
    type: "bank",
    name: "Bank Transfer",
    icon: "bank",
  },
  {
    type: "digital_wallet",
    name: "Digital Wallet",
    icon: "wallet",
  },
];

// Finix styling to match our app theme
export const FINIX_STYLING = {
  base: {
    color: "hsl(20, 14.3%, 4.1%)",
    fontFamily: "Inter, sans-serif",
    fontSize: "16px",
    fontWeight: "400",
    lineHeight: "1.5",
  },
  invalid: {
    color: "hsl(0, 84.2%, 60.2%)",
  },
  placeholder: {
    color: "hsl(25, 5.3%, 44.7%)",
  },
};

// Create payment session with Finix
export const createPaymentSession = async (
  amount: number,
  currency: string,
  reference: string,
) => {
  // In production, this would call your backend API to create a real Finix payment session
  // For now, we'll create the configuration needed for Finix integration
  const sessionId = `FS${Date.now()}`;

  return {
    id: sessionId,
    amount: {
      currency,
      value: amount * 100, // Finix expects amount in cents
    },
    reference,
    applicationId: FINIX_CONFIG.applicationId,
    countryCode: FINIX_CONFIG.countryCode,
    returnUrl: window.location.origin + "/checkout/return",
    // Additional configuration for real Finix session
    configuration: {
      environment: FINIX_CONFIG.environment,
      applicationId: FINIX_CONFIG.applicationId,
      analytics: {
        enabled: true,
      },
    },
  };
};

// Process payment with real Finix integration
export const processPayment = async (paymentData: any, sessionData: any) => {
  try {
    // In production, this would call your backend API to process the payment
    // The backend would then call Finix's /transfers endpoint

    const paymentRequest = {
      amount: sessionData.amount.value,
      currency: sessionData.amount.currency,
      reference: sessionData.reference,
      applicationId: FINIX_CONFIG.applicationId,
      paymentMethod: paymentData.paymentMethod,
      merchantId: paymentData.merchantId,
    };

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock successful payment response
    // For test cards, return successful response
    // In production, this would be the actual response from Finix
    return {
      resultCode: "Authorised",
      pspReference: `PSP${Date.now()}`,
      merchantReference: sessionData.reference,
      amount: sessionData.amount,
      paymentMethod: paymentData.paymentMethod,
    };
  } catch (error) {
    console.error("Payment processing error:", error);
    throw error;
  }
};

// Store payment method with Finix tokenization
export const storePaymentMethod = async (paymentMethodData: any) => {
  try {
    // In production, this would call your backend to store the payment method
    // The backend would use Finix's payment instrument tokenization service

    const tokenRequest = {
      paymentMethod: paymentMethodData.paymentMethod,
      applicationId: FINIX_CONFIG.applicationId,
      merchantReference: `MERCHANT_${Date.now()}`, // Should be merchant ID
      type: "PAYMENT_CARD",
    };

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Return mock stored payment method
    return {
      recurringDetailReference: `RDR${Date.now()}`,
      paymentMethod: paymentMethodData.paymentMethod,
      storedPaymentMethodId: `SPM${Date.now()}`,
    };
  } catch (error) {
    console.error("Payment method storage error:", error);
    throw error;
  }
};

// Initialize Finix payment processing
export const initializeFinixPayment = (configuration: any) => {
  return {
    ...FINIX_CONFIG,
    ...configuration,
    create: (type: string, config: any) => {
      // Mock Finix component creation
      return {
        mount: (selector: string) => {
          console.log(`Mounting Finix ${type} component to ${selector}`);
        },
        unmount: () => {
          console.log(`Unmounting Finix ${type} component`);
        },
      };
    },
  };
};

export default {
  FINIX_CONFIG,
  FINIX_PAYMENT_METHODS,
  FINIX_STYLING,
  createPaymentSession,
  processPayment,
  storePaymentMethod,
  initializeFinixPayment,
};
