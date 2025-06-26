import { loadStripe } from "@stripe/stripe-js";

// Replace with your actual Stripe publishable key
// For development, you can use Stripe test keys
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789",
);

export const STRIPE_CONFIG = {
  appearance: {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "hsl(15, 84%, 58%)",
      colorBackground: "hsl(0, 0%, 100%)",
      colorText: "hsl(20, 14.3%, 4.1%)",
      colorDanger: "hsl(0, 84.2%, 60.2%)",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      borderRadius: "12px",
    },
    rules: {
      ".Input": {
        borderColor: "hsl(35, 100%, 90%)",
        boxShadow: "none",
      },
      ".Input:focus": {
        borderColor: "hsl(15, 84%, 58%)",
        boxShadow: "0 0 0 1px hsl(15, 84%, 58%)",
      },
    },
  },
  clientSecret: "", // This would be set when creating a payment intent
};

export const createPaymentIntent = async (amount: number, currency = "usd") => {
  // In a real app, this would call your backend API
  // For demo purposes, we'll simulate this
  return {
    client_secret: "pi_test_1234567890_secret_test123456789",
    status: "requires_payment_method",
  };
};

export const confirmPayment = async (clientSecret: string) => {
  // In a real app, this would be handled by Stripe
  // For demo purposes, we'll simulate success
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        paymentIntent: {
          status: "succeeded",
          id: "pi_test_" + Date.now(),
        },
      });
    }, 2000);
  });
};
