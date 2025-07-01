import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CreditCard,
  Shield,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface StripePaymentFormStubProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: any) => void;
  clientSecret?: string;
  connectedAccountId?: string;
  showExpressCheckout?: boolean;
  customerEmail?: string;
  isSetupIntent?: boolean;
}

// Test card numbers for Stripe testing
const TEST_CARDS = {
  "4242424242424242": { brand: "Visa", result: "success" },
  "4000000000000002": { brand: "Visa", result: "declined" },
  "4000000000009995": { brand: "Visa", result: "insufficient_funds" },
  "4000000000009987": { brand: "Visa", result: "lost_card" },
  "4000000000009979": { brand: "Visa", result: "stolen_card" },
  "5555555555554444": { brand: "Mastercard", result: "success" },
  "378282246310005": { brand: "American Express", result: "success" },
  "6011111111111117": { brand: "Discover", result: "success" },
};

const StripePaymentFormStub: React.FC<StripePaymentFormStubProps> = ({
  amount,
  currency = "usd",
  onSuccess,
  onError,
  connectedAccountId,
  customerEmail,
  isSetupIntent = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("4242424242424242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("123");
  const [email, setEmail] = useState(customerEmail || "test@example.com");
  const [selectedTestCard, setSelectedTestCard] = useState("4242424242424242");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      // Call real backend to create payment intent
      console.log("Creating payment intent with backend...");
      const response = await fetch(
        "http://localhost:8000/api/create-payment-intent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            currency,
            reference: `test_payment_${Date.now()}`,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }

      const paymentData = await response.json();
      console.log("Payment intent created:", paymentData);

      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const testCard = TEST_CARDS[cardNumber as keyof typeof TEST_CARDS];

      if (!testCard) {
        onError({
          message: "Invalid card number. Please use a test card number.",
          type: "card_error",
        });
        setIsLoading(false);
        return;
      }

      if (testCard.result === "success") {
        // Use real payment intent data from backend
        const mockPaymentIntent = {
          id: paymentData.payment_intent_id,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: isSetupIntent ? "setup_succeeded" : "succeeded",
          payment_method: {
            card: {
              brand: testCard.brand.toLowerCase(),
              last4: cardNumber.slice(-4),
              exp_month: parseInt(expiry.split("/")[0]),
              exp_year: parseInt("20" + expiry.split("/")[1]),
            },
            type: "card",
          },
          created: Math.floor(Date.now() / 1000),
          receipt_url: isSetupIntent
            ? null
            : `https://pay.stripe.com/receipts/test_receipt_${Date.now()}`,
          client_secret: paymentData.client_secret,
        };

        onSuccess(mockPaymentIntent);
      } else {
        // Simulate payment error
        const errorMessages = {
          declined: "Your card was declined.",
          insufficient_funds: "Your card has insufficient funds.",
          lost_card: "Your card was reported as lost.",
          stolen_card: "Your card was reported as stolen.",
        };

        onError({
          message:
            errorMessages[testCard.result as keyof typeof errorMessages] ||
            "Payment failed.",
          type: "card_error",
          decline_code: testCard.result,
        });
      }
    } catch (apiError) {
      console.error("Backend API error:", apiError);
      onError({
        message: "Failed to connect to payment processor. Please try again.",
        type: "api_error",
      });
    }

    setIsLoading(false);
  };

  const handleTestCardSelect = (cardNumber: string) => {
    setSelectedTestCard(cardNumber);
    setCardNumber(cardNumber);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Information (Test Mode)
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
          <Badge
            variant="outline"
            className="text-xs bg-yellow-50 text-yellow-800"
          >
            Test Mode
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Development Mode:</strong> This is a test payment form. No
            real charges will be made. Use the test card numbers below or enter
            custom test cards.
          </AlertDescription>
        </Alert>

        {/* Test Card Selector */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block">
            Quick Test Cards
          </Label>
          <Select value={selectedTestCard} onValueChange={handleTestCardSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a test card" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TEST_CARDS).map(([number, info]) => (
                <SelectItem key={number} value={number}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      ****{number.slice(-4)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {info.brand}
                    </span>
                    <span
                      className={`text-xs px-1 rounded ${
                        info.result === "success"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {info.result === "success" ? "Success" : "Error"}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ""))}
              placeholder="4242 4242 4242 4242"
              maxLength={16}
              className="font-mono"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter a test card number or select from the dropdown above
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                maxLength={5}
                className="font-mono"
                required
              />
            </div>
            <div>
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                maxLength={4}
                className="font-mono"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSetupIntent
                  ? "Adding Payment Method..."
                  : "Processing Test Payment..."}
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                {isSetupIntent
                  ? "Add Payment Method"
                  : `Test Pay $${(amount / 100).toFixed(2)}`}
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            Test Mode - No real charges
          </div>
        </form>

        {/* Test Cards Reference */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Test Card Reference
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              <code>4242424242424242</code> - Visa (Success)
            </div>
            <div>
              <code>4000000000000002</code> - Visa (Declined)
            </div>
            <div>
              <code>4000000000009995</code> - Visa (Insufficient Funds)
            </div>
            <div>
              <code>5555555555554444</code> - Mastercard (Success)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripePaymentFormStub;
