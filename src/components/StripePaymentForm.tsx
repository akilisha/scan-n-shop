import React, { useState, useEffect } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
  LinkAuthenticationElement,
  ExpressCheckoutElement,
} from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Shield, Zap } from "lucide-react";
import {
  getStripe,
  STRIPE_ELEMENT_OPTIONS,
  createPaymentIntent,
  confirmPayment,
} from "@/lib/stripe";

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: any) => void;
  clientSecret?: string;
  connectedAccountId?: string;
  showExpressCheckout?: boolean;
  customerEmail?: string;
}

interface CheckoutFormProps
  extends Omit<StripePaymentFormProps, "clientSecret"> {
  clientSecret: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  amount,
  currency = "usd",
  onSuccess,
  onError,
  clientSecret,
  showExpressCheckout = true,
  customerEmail,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(customerEmail || "");
  const [expressCheckoutReady, setExpressCheckoutReady] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await confirmPayment(
        stripe,
        elements,
        clientSecret,
        `${window.location.origin}/checkout/return`,
      );

      if (result.error) {
        setError(result.error.message || "An error occurred during payment.");
        onError(result.error);
      } else if (result.paymentIntent) {
        onSuccess(result.paymentIntent);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpressCheckout = (event: any) => {
    if (event.complete) {
      onSuccess(event.paymentIntent);
    } else if (event.error) {
      setError(event.error.message);
      onError(event.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Express Checkout Section */}
      {showExpressCheckout && (
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Express Checkout</span>
          </div>
          <ExpressCheckoutElement
            onReady={() => setExpressCheckoutReady(true)}
            onClick={handleExpressCheckout}
            options={{
              buttonType: {
                applePay: "pay",
                googlePay: "pay",
              },
            }}
          />
          {expressCheckoutReady && (
            <p className="text-xs text-muted-foreground mt-2">
              Pay faster with your saved payment methods
            </p>
          )}
        </div>
      )}

      {/* Regular Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Link Authentication */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Email Address
          </label>
          <LinkAuthenticationElement
            options={{
              defaultValues: {
                email: email,
              },
            }}
            onChange={(event) => {
              if (event.value?.email) {
                setEmail(event.value.email);
              }
            }}
          />
        </div>

        {/* Payment Element */}
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Information
          </label>
          <PaymentElement
            options={{
              ...STRIPE_ELEMENT_OPTIONS,
              fields: {
                billingDetails: {
                  email: "never",
                },
              },
            }}
          />
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!stripe || !elements || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Pay ${(amount / 100).toFixed(2)}
            </>
          )}
        </Button>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          Secured by Stripe
        </div>
      </form>
    </div>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  currency = "usd",
  onSuccess,
  onError,
  clientSecret: providedClientSecret,
  connectedAccountId,
  showExpressCheckout = true,
  customerEmail,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(
    providedClientSecret || null,
  );
  const [isLoading, setIsLoading] = useState(!providedClientSecret);
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      const stripeInstance = await getStripe();
      setStripe(stripeInstance);
    };
    initializeStripe();
  }, []);

  useEffect(() => {
    if (!providedClientSecret) {
      createPaymentIntent(
        amount,
        currency,
        `payment_${Date.now()}`,
        connectedAccountId,
      )
        .then((response) => {
          setClientSecret(response.client_secret);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Failed to create payment intent:", error);
          onError(error);
          setIsLoading(false);
        });
    }
  }, [amount, currency, connectedAccountId, providedClientSecret, onError]);

  if (isLoading || !stripe || !clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="stripe-loading-element" />
            <div className="stripe-loading-element" />
            <div className="stripe-loading-element" />
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading payment form...
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "hsl(221.2 83.2% 53.3%)",
        colorBackground: "hsl(0 0% 100%)",
        colorText: "hsl(224 71.4% 4.1%)",
        colorDanger: "hsl(0 84.2% 60.2%)",
        fontFamily: "Inter, sans-serif",
        spacingUnit: "4px",
        borderRadius: "6px",
      },
    },
    ...(connectedAccountId && { stripeAccount: connectedAccountId }),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Information
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Amount: ${(amount / 100).toFixed(2)} {currency.toUpperCase()}
          </Badge>
          {connectedAccountId && (
            <Badge variant="outline" className="text-xs">
              Marketplace Payment
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripe} options={options}>
          <CheckoutForm
            amount={amount}
            currency={currency}
            onSuccess={onSuccess}
            onError={onError}
            clientSecret={clientSecret}
            showExpressCheckout={showExpressCheckout}
            customerEmail={customerEmail}
          />
        </Elements>
      </CardContent>
    </Card>
  );
};

export default StripePaymentForm;
