import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, Smartphone, Wallet } from "lucide-react";
import {
  initializeAdyenCheckout,
  createPaymentSession,
  processPayment,
  PAYMENT_METHODS_CONFIG,
  ADYEN_STYLING,
} from "@/lib/adyen";

interface AdyenPaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function AdyenPaymentForm({
  amount,
  onSuccess,
  onError,
}: AdyenPaymentFormProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<any>(null);
  const dropinRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const applePayRef = useRef<HTMLDivElement>(null);
  const googlePayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializePayment();
  }, [amount]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create payment session
      const session = await createPaymentSession(amount);

      // Initialize Adyen Checkout
      const checkoutInstance = await initializeAdyenCheckout({
        amount: session.amount,
        onSubmit: handlePaymentSubmit,
        onAdditionalDetails: handleAdditionalDetails,
        onError: handlePaymentError,
      });

      setCheckout(checkoutInstance);

      // Mount payment components
      mountPaymentComponents(checkoutInstance, session);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize payment";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const mountPaymentComponents = (checkoutInstance: any, session: any) => {
    // Card Component
    if (cardRef.current) {
      const cardComponent = checkoutInstance.create("card", {
        ...PAYMENT_METHODS_CONFIG.paymentMethods.card,
        styles: ADYEN_STYLING,
        onChange: (state: any) => {
          // Handle card validation state
          console.log("Card state:", state);
        },
      });
      cardComponent.mount(cardRef.current);
    }

    // Apple Pay (if supported)
    if (applePayRef.current && window.ApplePaySession) {
      try {
        const applePayComponent = checkoutInstance.create("applepay", {
          ...PAYMENT_METHODS_CONFIG.applepay,
          amount: session.amount,
          onAuthorized: (resolve: any, reject: any, event: any) => {
            // Handle Apple Pay authorization
            resolve();
          },
        });
        applePayComponent.mount(applePayRef.current);
      } catch (err) {
        console.log("Apple Pay not supported");
      }
    }

    // Google Pay (if supported)
    if (googlePayRef.current) {
      try {
        const googlePayComponent = checkoutInstance.create("googlepay", {
          ...PAYMENT_METHODS_CONFIG.googlepay,
          amount: session.amount,
        });
        googlePayComponent.mount(googlePayRef.current);
      } catch (err) {
        console.log("Google Pay not supported");
      }
    }
  };

  const handlePaymentSubmit = async (state: any, element: any) => {
    try {
      setProcessing(true);
      setError(null);

      // Process payment
      const result = await processPayment(state.data);

      if (result.resultCode === "Authorised") {
        onSuccess();
      } else {
        throw new Error("Payment was not authorized");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Payment failed";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleAdditionalDetails = async (state: any, element: any) => {
    // Handle 3D Secure or other additional details
    console.log("Additional details required:", state);
  };

  const handlePaymentError = (error: any) => {
    const errorMessage = error.message || "An error occurred during payment";
    setError(errorMessage);
    onError(errorMessage);
    setProcessing(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading payment options...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Credit/Debit Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard size={20} />
            <span>Credit or Debit Card</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={cardRef} className="adyen-card-component" />
          {processing && (
            <div className="flex items-center justify-center mt-4 p-4 bg-muted/50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">
                Processing payment...
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digital Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Apple Pay */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone size={20} />
              <span>Apple Pay</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={applePayRef} className="adyen-applepay-component" />
          </CardContent>
        </Card>

        {/* Google Pay */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet size={20} />
              <span>Google Pay</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={googlePayRef} className="adyen-googlepay-component" />
          </CardContent>
        </Card>
      </div>

      {/* Total Amount Display */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Amount:</span>
            <span className="text-xl font-bold text-primary">
              ${amount.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
