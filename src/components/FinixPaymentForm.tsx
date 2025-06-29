import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { usePaymentMethods } from "@/contexts/PaymentMethodsContext";

interface FinixPaymentFormProps {
  amount: number;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

type CardType = "visa" | "mastercard" | "amex" | "discover" | null;

export function FinixPaymentForm({
  amount,
  onSuccess,
  onError,
}: FinixPaymentFormProps) {
  const { addUserPaymentMethod, paymentMethods } = usePaymentMethods();
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [cardType, setCardType] = useState<CardType>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  // Check if digital wallets are supported
  const isApplePaySupported =
    (window as any).ApplePaySession &&
    (window as any).ApplePaySession.canMakePayments;
  const isGooglePaySupported =
    (window as any).google && (window as any).google.payments;

  const detectCardType = (cardNumber: string): CardType | null => {
    const cleanNumber = cardNumber.replace(/\s/g, "");

    if (/^4/.test(cleanNumber)) return "visa";
    if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber))
      return "mastercard";
    if (/^3[47]/.test(cleanNumber)) return "amex";
    if (/^6(?:011|5)/.test(cleanNumber)) return "discover";

    return null;
  };

  const formatCardNumber = (value: string): string => {
    const cleanValue = value.replace(/\s/g, "");
    const groups = cleanValue.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleanValue;
  };

  const formatExpiryDate = (value: string): string => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length >= 2) {
      return cleanValue.substring(0, 2) + "/" + cleanValue.substring(2, 4);
    }
    return cleanValue;
  };

  const validateCard = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (
      !cardData.cardNumber ||
      cardData.cardNumber.replace(/\s/g, "").length < 16
    ) {
      newErrors.cardNumber = "Please enter a valid card number";
    }

    if (!cardData.expiryDate || !/^\d{2}\/\d{2}$/.test(cardData.expiryDate)) {
      newErrors.expiryDate = "Please enter a valid expiry date (MM/YY)";
    }

    if (!cardData.cvv || cardData.cvv.length < 3) {
      newErrors.cvv = "Please enter a valid CVV";
    }

    if (!cardData.cardholderName.trim()) {
      newErrors.cardholderName = "Please enter the cardholder name";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === "cardNumber") {
      formattedValue = formatCardNumber(value);
      setCardType(detectCardType(value));
    } else if (field === "expiryDate") {
      formattedValue = formatExpiryDate(value);
    } else if (field === "cvv") {
      formattedValue = value.replace(/\D/g, "").substring(0, 4);
    }

    setCardData((prev) => ({ ...prev, [field]: formattedValue }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCard()) {
      return;
    }

    setLoading(true);

    try {
      // Create payment method object in Finix format
      const paymentMethodData = {
        paymentMethod: {
          type: "PAYMENT_CARD",
          number: cardData.cardNumber.replace(/\s/g, ""),
          expiration_month: parseInt(cardData.expiryDate.split("/")[0]),
          expiration_year: parseInt("20" + cardData.expiryDate.split("/")[1]),
          security_code: cardData.cvv,
          name: cardData.cardholderName,
        },
      };

      if (amount > 0) {
        // Process payment
        const { processPayment, createPaymentSession } = await import(
          "@/lib/finix"
        );

        const sessionData = await createPaymentSession(
          amount,
          "USD",
          `REF${Date.now()}`,
        );

        const result = await processPayment(paymentMethodData, sessionData);

        // Add payment method to user's stored methods
        await addUserPaymentMethod({
          id: `pm_${Date.now()}`,
          type: "card",
          last4: cardData.cardNumber.slice(-4),
          brand: cardType || "unknown",
          expiryMonth: parseInt(cardData.expiryDate.split("/")[0]),
          expiryYear: parseInt("20" + cardData.expiryDate.split("/")[1]),
          isDefault: paymentMethods.length === 0,
          nickname: `${cardType?.toUpperCase() || "Card"} ending in ${cardData.cardNumber.slice(-4)}`,
        });

        onSuccess?.(result);
      } else {
        // For amount = 0, just store payment method
        const { storePaymentMethod } = await import("@/lib/finix");

        await storePaymentMethod(paymentMethodData);

        await addUserPaymentMethod({
          id: `pm_${Date.now()}`,
          type: "card",
          last4: cardData.cardNumber.slice(-4),
          brand: cardType || "unknown",
          expiryMonth: parseInt(cardData.expiryDate.split("/")[0]),
          expiryYear: parseInt("20" + cardData.expiryDate.split("/")[1]),
          isDefault: paymentMethods.length === 0,
          nickname: `${cardType?.toUpperCase() || "Card"} ending in ${cardData.cardNumber.slice(-4)}`,
        });

        onSuccess?.({ stored: true });
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const getCardIcon = (type: CardType) => {
    const iconClasses = "w-8 h-5 rounded border border-gray-200";

    switch (type) {
      case "visa":
        return (
          <div
            className={`${iconClasses} bg-blue-600 text-white text-xs flex items-center justify-center font-bold`}
          >
            VISA
          </div>
        );
      case "mastercard":
        return (
          <div
            className={`${iconClasses} bg-red-600 text-white text-xs flex items-center justify-center font-bold`}
          >
            MC
          </div>
        );
      case "amex":
        return (
          <div
            className={`${iconClasses} bg-green-600 text-white text-xs flex items-center justify-center font-bold`}
          >
            AMEX
          </div>
        );
      case "discover":
        return (
          <div
            className={`${iconClasses} bg-orange-600 text-white text-xs flex items-center justify-center font-bold`}
          >
            DISC
          </div>
        );
      default:
        return <div className={`${iconClasses} bg-gray-200`} />;
    }
  };

  return (
    <div ref={componentRef} className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payment Details</span>
            {cardType && (
              <div className="flex items-center space-x-2">
                {getCardIcon(cardType)}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.cardNumber}
                  onChange={(e) =>
                    handleInputChange("cardNumber", e.target.value)
                  }
                  maxLength={19}
                  className={errors.cardNumber ? "border-red-500" : ""}
                />
                {cardType && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getCardIcon(cardType)}
                  </div>
                )}
              </div>
              {errors.cardNumber && (
                <p className="text-sm text-red-500">{errors.cardNumber}</p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="text"
                  placeholder="MM/YY"
                  value={cardData.expiryDate}
                  onChange={(e) =>
                    handleInputChange("expiryDate", e.target.value)
                  }
                  maxLength={5}
                  className={errors.expiryDate ? "border-red-500" : ""}
                />
                {errors.expiryDate && (
                  <p className="text-sm text-red-500">{errors.expiryDate}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  value={cardData.cvv}
                  onChange={(e) => handleInputChange("cvv", e.target.value)}
                  maxLength={4}
                  className={errors.cvv ? "border-red-500" : ""}
                />
                {errors.cvv && (
                  <p className="text-sm text-red-500">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                type="text"
                placeholder="John Doe"
                value={cardData.cardholderName}
                onChange={(e) =>
                  handleInputChange("cardholderName", e.target.value)
                }
                className={errors.cardholderName ? "border-red-500" : ""}
              />
              {errors.cardholderName && (
                <p className="text-sm text-red-500">{errors.cardholderName}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Processing..."
                : amount > 0
                  ? `Pay $${amount.toFixed(2)}`
                  : "Add Payment Method"}
            </Button>
          </form>

          <Separator className="my-6" />

          {/* Digital Wallets */}
          {(isApplePaySupported || isGooglePaySupported) && (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Or pay with
              </p>

              {isApplePaySupported && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-black text-white hover:bg-gray-800"
                  onClick={() => {
                    // Handle Apple Pay
                    onError?.({ message: "Apple Pay not implemented yet" });
                  }}
                >
                  🍎 Apple Pay
                </Button>
              )}

              {isGooglePaySupported && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Handle Google Pay
                    onError?.({ message: "Google Pay not implemented yet" });
                  }}
                >
                  🌐 Google Pay
                </Button>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>
                Powered by{" "}
                <span className="text-primary font-medium">Finix</span>. Your
                payment information is secure and encrypted with
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
