import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, Smartphone, Wallet, Shield } from "lucide-react";
import { usePaymentMethods } from "@/contexts/PaymentMethodsContext";

interface AdyenPaymentFormProps {
  amount: number;
  onSuccess: (paymentMethodDetails?: any) => void;
  onError: (error: string) => void;
}

interface CardType {
  name: string;
  pattern: RegExp;
  maxLength: number;
  cvvLength: number;
  logo: string;
}

const CARD_TYPES: CardType[] = [
  {
    name: "visa",
    pattern: /^4[0-9]{12}(?:[0-9]{3})?$/,
    maxLength: 19,
    cvvLength: 3,
    logo: "💳",
  },
  {
    name: "mastercard",
    pattern: /^5[1-5][0-9]{14}$/,
    maxLength: 19,
    cvvLength: 3,
    logo: "💳",
  },
  {
    name: "amex",
    pattern: /^3[47][0-9]{13}$/,
    maxLength: 17,
    cvvLength: 4,
    logo: "💳",
  },
  {
    name: "discover",
    pattern: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
    maxLength: 19,
    cvvLength: 3,
    logo: "💳",
  },
];

export function AdyenPaymentForm({
  amount,
  onSuccess,
  onError,
}: AdyenPaymentFormProps) {
  const { addUserPaymentMethod, paymentMethods } = usePaymentMethods();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedCardType, setDetectedCardType] = useState<CardType | null>(
    null,
  );
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    billingAddress: "",
    city: "",
    zipCode: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Check if digital wallets are supported
  const isApplePaySupported =
    (window as any).ApplePaySession &&
    (window as any).ApplePaySession.canMakePayments;
  const isGooglePaySupported =
    (window as any).google && (window as any).google.payments;

  const detectCardType = (cardNumber: string): CardType | null => {
    const cleanNumber = cardNumber.replace(/\s/g, "");
    for (const cardType of CARD_TYPES) {
      if (cardType.pattern.test(cleanNumber)) {
        return cardType;
      }
    }
    return null;
  };

  const formatCardNumber = (value: string): string => {
    const cleanValue = value.replace(/\s/g, "");
    const cardType = detectCardType(cleanValue);

    if (cardType?.name === "amex") {
      // American Express: 4-6-5 format
      return cleanValue.replace(/(\d{4})(\d{6})(\d{5})/, "$1 $2 $3");
    } else {
      // Others: 4-4-4-4 format
      return cleanValue.replace(/(\d{4})(?=\d)/g, "$1 ");
    }
  };

  const formatExpiryDate = (value: string): string => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length >= 2) {
      return cleanValue.substring(0, 2) + "/" + cleanValue.substring(2, 4);
    }
    return cleanValue;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.cardholderName.trim()) {
      errors.cardholderName = "Cardholder name is required";
    }

    const cleanCardNumber = formData.cardNumber.replace(/\s/g, "");
    if (!cleanCardNumber) {
      errors.cardNumber = "Card number is required";
    } else if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      errors.cardNumber = "Invalid card number";
    } else if (!detectedCardType) {
      errors.cardNumber = "Unsupported card type";
    }

    const expiryParts = formData.expiryDate.split("/");
    if (!formData.expiryDate || expiryParts.length !== 2) {
      errors.expiryDate = "Valid expiry date required (MM/YY)";
    } else {
      const month = parseInt(expiryParts[0]);
      const year = parseInt("20" + expiryParts[1]);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      if (month < 1 || month > 12) {
        errors.expiryDate = "Invalid month";
      } else if (
        year < currentYear ||
        (year === currentYear && month < currentMonth)
      ) {
        errors.expiryDate = "Card has expired";
      }
    }

    const expectedCvvLength = detectedCardType?.cvvLength || 3;
    if (!formData.cvv) {
      errors.cvv = "CVV is required";
    } else if (formData.cvv.length !== expectedCvvLength) {
      errors.cvv = `CVV must be ${expectedCvvLength} digits`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === "cardNumber") {
      const cleanValue = value.replace(/\s/g, "");
      if (cleanValue.length <= 19) {
        formattedValue = formatCardNumber(cleanValue);
        const cardType = detectCardType(cleanValue);
        setDetectedCardType(cardType);
      } else {
        return; // Don't update if too long
      }
    } else if (field === "expiryDate") {
      formattedValue = formatExpiryDate(value);
      if (formattedValue.length > 5) return; // Don't update if too long
    } else if (field === "cvv") {
      const cleanValue = value.replace(/\D/g, "");
      const maxLength = detectedCardType?.cvvLength || 4;
      if (cleanValue.length <= maxLength) {
        formattedValue = cleanValue;
      } else {
        return; // Don't update if too long
      }
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Please correct the errors below");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment method object in Adyen format
      const paymentMethodData = {
        type: "scheme",
        number: formData.cardNumber.replace(/\s/g, ""),
        expiryMonth: formData.expiryDate.split("/")[0],
        expiryYear: "20" + formData.expiryDate.split("/")[1],
        cvc: formData.cvv,
        holderName: formData.cardholderName,
      };

      // For payment amounts > 0, process payment
      if (amount > 0) {
        const { processPayment, createPaymentSession } = await import(
          "@/lib/adyen"
        );

        // Create payment session
        const session = await createPaymentSession(amount);

        // Process payment
        const result = await processPayment(
          { paymentMethod: paymentMethodData },
          session,
        );

        if (result.resultCode === "Authorised") {
          // Create payment method details for the order
          const cardType = detectCardType(formData.cardNumber);
          const paymentMethodDetails = {
            type: "card" as const,
            last4: formData.cardNumber.replace(/\s/g, "").slice(-4),
            brand: cardType?.name || "unknown",
            expiryMonth: parseInt(formData.expiryDate.split("/")[0]),
            expiryYear: parseInt("20" + formData.expiryDate.split("/")[1]),
            nickname: `${cardType?.name?.toUpperCase() || "CARD"} ••••${formData.cardNumber.replace(/\s/g, "").slice(-4)}`,
            isDefault: paymentMethods.length === 0, // Set as default if it's the first card
          };

          // Save payment method to database for future use
          try {
            await addUserPaymentMethod(paymentMethodDetails);
          } catch (saveError) {
            console.error(
              "Warning: Failed to save payment method for future use:",
              saveError,
            );
            // Don't fail the payment if saving fails
          }

          // Pass payment method details to success callback
          onSuccess(paymentMethodDetails);
        } else {
          throw new Error("Payment was not authorized");
        }
      } else {
        // For amount = 0, just store payment method
        const { storePaymentMethod } = await import("@/lib/adyen");

        const result = await storePaymentMethod({
          paymentMethod: paymentMethodData,
        });

        if (result.resultCode === "Success") {
          // Save payment method to database
          const cardType = detectCardType(formData.cardNumber);
          const paymentMethodToSave = {
            type: "card" as const,
            last4: formData.cardNumber.replace(/\s/g, "").slice(-4),
            brand: cardType?.name || "unknown",
            expiryMonth: parseInt(formData.expiryDate.split("/")[0]),
            expiryYear: parseInt("20" + formData.expiryDate.split("/")[1]),
            nickname: `${cardType?.name?.toUpperCase() || "CARD"} ••••${formData.cardNumber.replace(/\s/g, "").slice(-4)}`,
            isDefault: false,
          };

          const { error } = await addUserPaymentMethod(paymentMethodToSave);
          if (error) {
            console.error("Error saving payment method:", error);
            onError(
              "Payment method added but failed to save. Please try again.",
            );
            return;
          }

          onSuccess();
        } else {
          throw new Error("Failed to store payment method");
        }
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

  const handleApplePay = async () => {
    if (!isApplePaySupported) {
      setError("Apple Pay is not supported on this device");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Simulate Apple Pay authentication flow
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate user authentication
          if (Math.random() > 0.2) {
            // 80% success rate
            resolve(true);
          } else {
            reject(new Error("User cancelled Apple Pay"));
          }
        }, 1500);
      });

      onSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Apple Pay failed";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleGooglePay = async () => {
    if (!isGooglePaySupported) {
      setError("Google Pay is not supported on this device");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Simulate Google Pay authentication flow
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate user authentication
          if (Math.random() > 0.2) {
            // 80% success rate
            resolve(true);
          } else {
            reject(new Error("User cancelled Google Pay"));
          }
        }, 1500);
      });

      onSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Google Pay failed";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Credit/Debit Card Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard size={20} />
              <span>Credit or Debit Card</span>
            </div>
            {detectedCardType && (
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{detectedCardType.logo}</span>
                <span className="text-sm font-medium text-muted-foreground uppercase">
                  {detectedCardType.name}
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                value={formData.cardholderName}
                onChange={(e) =>
                  handleInputChange("cardholderName", e.target.value)
                }
                placeholder="John Doe"
                className={
                  formErrors.cardholderName ? "border-destructive" : ""
                }
                required
              />
              {formErrors.cardholderName && (
                <p className="text-sm text-destructive">
                  {formErrors.cardholderName}
                </p>
              )}
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={formData.cardNumber}
                onChange={(e) =>
                  handleInputChange("cardNumber", e.target.value)
                }
                placeholder="1234 5678 9012 3456"
                className={formErrors.cardNumber ? "border-destructive" : ""}
                required
              />
              {formErrors.cardNumber && (
                <p className="text-sm text-destructive">
                  {formErrors.cardNumber}
                </p>
              )}
            </div>

            {/* Expiry Date and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    handleInputChange("expiryDate", e.target.value)
                  }
                  placeholder="MM/YY"
                  className={formErrors.expiryDate ? "border-destructive" : ""}
                  required
                />
                {formErrors.expiryDate && (
                  <p className="text-sm text-destructive">
                    {formErrors.expiryDate}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">
                  CVV{" "}
                  {detectedCardType && `(${detectedCardType.cvvLength} digits)`}
                </Label>
                <Input
                  id="cvv"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange("cvv", e.target.value)}
                  placeholder={
                    detectedCardType?.name === "amex" ? "1234" : "123"
                  }
                  className={formErrors.cvv ? "border-destructive" : ""}
                  type="password"
                  required
                />
                {formErrors.cvv && (
                  <p className="text-sm text-destructive">{formErrors.cvv}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `${amount > 0 ? `Pay $${amount.toFixed(2)}` : "Add Card"}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Digital Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Apple Pay */}
        <Card className={!isApplePaySupported ? "opacity-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone size={20} />
              <span>Apple Pay</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleApplePay}
              disabled={processing || !isApplePaySupported}
              className="w-full bg-black hover:bg-gray-800 text-white disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isApplePaySupported ? (
                "Pay with Apple Pay"
              ) : (
                "Not Available"
              )}
            </Button>
            {!isApplePaySupported && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Only available on Safari/iOS
              </p>
            )}
          </CardContent>
        </Card>

        {/* Google Pay */}
        <Card className={!isGooglePaySupported ? "opacity-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet size={20} />
              <span>Google Pay</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGooglePay}
              disabled={processing || !isGooglePaySupported}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isGooglePaySupported ? (
                "Pay with Google Pay"
              ) : (
                "Not Available"
              )}
            </Button>
            {!isGooglePaySupported && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Only available on supported browsers
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Total Amount Display */}
      {amount > 0 && (
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
      )}

      {/* Security Notice */}
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield size={16} />
            <span>
              Powered by <span className="text-primary font-medium">Adyen</span>
              . Your payment information is secure and encrypted with
              industry-standard SSL.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
